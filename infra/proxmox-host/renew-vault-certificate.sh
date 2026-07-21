#!/usr/bin/env bash

set -euo pipefail
umask 0077

readonly vault_addr="https://vault.service.home.arpa:8200"
readonly auth_path="auth/approle/login"
readonly issue_path="pki_int/issue/proxmox-dell-r730xd-listener"
readonly common_name="proxmox.dell-r730xd.home.arpa"
readonly ttl="720h"
readonly renew_before_seconds="$((7 * 24 * 60 * 60))"
readonly environment_file="/etc/proxmox-vault-pki.env"
readonly ca_file="/etc/ssl/certs/ca-certificates.crt"
readonly state_directory="/var/lib/proxmox-vault-pki"
readonly backup_directory="${state_directory}/bootstrap-backup"
readonly request_fingerprint_file="${state_directory}/request.sha256"
readonly certificate_file="/etc/pve/local/pveproxy-ssl.pem"
readonly key_file="/etc/pve/local/pveproxy-ssl.key"

for command in curl flock jq openssl pvenode sha256sum systemctl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Required command is missing: $command" >&2
    exit 1
  fi
done

install -d -o root -g root -m 0700 "$state_directory"
exec 9>"/run/lock/proxmox-vault-certificate.lock"
if ! flock -n 9; then
  echo "Another Proxmox certificate renewal is already running."
  exit 0
fi

certificate_matches_key() {
  local certificate_public_key private_public_key

  certificate_public_key="$(openssl x509 -in "$1" -pubkey -noout | openssl sha256)"
  private_public_key="$(openssl pkey -in "$2" -pubout | openssl sha256)"
  [[ "$certificate_public_key" == "$private_public_key" ]]
}

listener_is_healthy() {
  systemctl is-active --quiet pveproxy.service \
    && curl --fail --silent --show-error \
      --cacert "$ca_file" \
      --connect-timeout 5 \
      --max-time 15 \
      --resolve "$common_name:8006:127.0.0.1" \
      --output /dev/null \
      "https://$common_name:8006/"
}

wait_for_listener() {
  local attempt

  for attempt in {1..15}; do
    if listener_is_healthy; then
      return 0
    fi
    sleep 2
  done

  echo "Proxmox listener did not become healthy after certificate installation." >&2
  return 1
}

readonly request_fingerprint="$({
  printf '%s\0' "$vault_addr" "$auth_path" "$issue_path" "$common_name" "$ttl"
} | sha256sum | cut -d ' ' -f 1)"

if [[ -s "$certificate_file" ]] \
  && [[ -s "$key_file" ]] \
  && [[ -s "$request_fingerprint_file" ]] \
  && [[ "$(<"$request_fingerprint_file")" == "$request_fingerprint" ]] \
  && openssl x509 -checkend "$renew_before_seconds" -noout -in "$certificate_file" >/dev/null \
  && openssl x509 -checkhost "$common_name" -noout -in "$certificate_file" >/dev/null \
  && certificate_matches_key "$certificate_file" "$key_file"; then
  if listener_is_healthy; then
    echo "Proxmox listener certificate is still valid."
    exit 0
  fi

  echo "The certificate is valid, but the Proxmox listener is unhealthy." >&2
  exit 1
fi

if [[ ! -r "$environment_file" ]]; then
  echo "Missing readable Vault AppRole environment file: $environment_file" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$environment_file"
: "${VAULT_ROLE_ID:?VAULT_ROLE_ID is required in $environment_file}"
: "${VAULT_SECRET_ID:?VAULT_SECRET_ID is required in $environment_file}"

work_directory="$(mktemp -d "$state_directory/.renew.XXXXXX")"
token=""
cleanup() {
  if [[ -n "$token" ]]; then
    token_header_file="$work_directory/token-header"
    if [[ -s "$token_header_file" ]]; then
      curl --fail --silent --show-error \
        --cacert "$ca_file" \
        --connect-timeout 5 \
        --max-time 10 \
        --request POST \
        --header @"$token_header_file" \
        "$vault_addr/v1/auth/token/revoke-self" >/dev/null || true
    fi
  fi

  rm -rf "$work_directory"
}
trap cleanup EXIT

login_payload="$(
  jq -nc \
    --arg role_id "$VAULT_ROLE_ID" \
    --arg secret_id "$VAULT_SECRET_ID" \
    '{ role_id: $role_id, secret_id: $secret_id }'
)"
login_response="$(
  printf '%s' "$login_payload" \
    | curl --fail-with-body --silent --show-error \
      --cacert "$ca_file" \
      --connect-timeout 5 \
      --max-time 30 \
      --retry 2 \
      --retry-connrefused \
      --request POST \
      --header 'Content-Type: application/json' \
      --data-binary @- \
      "$vault_addr/v1/$auth_path"
)"
token="$(printf '%s' "$login_response" | jq -er '.auth.client_token')"
printf 'X-Vault-Token: %s\n' "$token" >"$work_directory/token-header"
chmod 0600 "$work_directory/token-header"

issue_payload="$(
  jq -nc \
    --arg common_name "$common_name" \
    --arg ttl "$ttl" \
    '{ common_name: $common_name, ttl: $ttl }'
)"
issue_response="$(
  printf '%s' "$issue_payload" \
    | curl --fail-with-body --silent --show-error \
      --cacert "$ca_file" \
      --connect-timeout 5 \
      --max-time 30 \
      --retry 2 \
      --retry-connrefused \
      --request POST \
      --header @"$work_directory/token-header" \
      --header 'Content-Type: application/json' \
      --data-binary @- \
      "$vault_addr/v1/$issue_path"
)"

printf '%s' "$issue_response" | jq -er '.data.private_key' >"$work_directory/key.pem"
printf '%s' "$issue_response" | jq -er '.data.certificate' >"$work_directory/certificate.pem"
printf '%s' "$issue_response" | jq -er '.data.issuing_ca' >"$work_directory/issuing-ca.pem"
cat "$work_directory/certificate.pem" "$work_directory/issuing-ca.pem" \
  >"$work_directory/fullchain.pem"

chmod 0600 "$work_directory/key.pem"
chmod 0644 "$work_directory/fullchain.pem"
openssl x509 -checkhost "$common_name" -noout -in "$work_directory/certificate.pem"
openssl verify \
  -CAfile "$ca_file" \
  -untrusted "$work_directory/issuing-ca.pem" \
  "$work_directory/certificate.pem"

if ! certificate_matches_key "$work_directory/certificate.pem" "$work_directory/key.pem"; then
  echo "Issued Proxmox certificate does not match its private key." >&2
  exit 1
fi

if [[ ! -e "$backup_directory/completed" ]]; then
  install -d -o root -g root -m 0700 "$backup_directory"
  if [[ -s "$certificate_file" ]] && [[ -s "$key_file" ]]; then
    install -o root -g root -m 0644 \
      "$certificate_file" \
      "$backup_directory/pveproxy-ssl.pem"
    install -o root -g root -m 0600 \
      "$key_file" \
      "$backup_directory/pveproxy-ssl.key"
  fi
  printf 'Created before the first Vault-managed certificate installation.\n' \
    >"$backup_directory/completed"
  chmod 0600 "$backup_directory/completed"
fi

pvenode cert set \
  "$work_directory/fullchain.pem" \
  "$work_directory/key.pem" \
  --force 1 \
  --restart 1

printf '%s\n' "$request_fingerprint" >"$work_directory/request.sha256"
install -o root -g root -m 0600 \
  "$work_directory/request.sha256" \
  "$request_fingerprint_file"

openssl x509 -checkhost "$common_name" -noout -in "$certificate_file"
if ! certificate_matches_key "$certificate_file" "$key_file"; then
  echo "Installed Proxmox certificate does not match its private key." >&2
  exit 1
fi
wait_for_listener

echo "Renewed Proxmox listener certificate for $common_name."
