#!/usr/bin/env bash

set -euo pipefail
umask 0077

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root on the Proxmox node." >&2
  exit 1
fi

if [[ "$#" -ne 2 ]]; then
  echo "Usage: $0 <dsqr-home-root-ca.pem> <proxmox-vault-pki.env>" >&2
  exit 1
fi

readonly root_ca_source="$1"
readonly environment_source="$2"
readonly script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

for file in \
  "$root_ca_source" \
  "$environment_source" \
  "$script_directory/renew-vault-certificate.sh" \
  "$script_directory/proxmox-vault-certificate.service" \
  "$script_directory/proxmox-vault-certificate.timer"; do
  if [[ ! -f "$file" ]]; then
    echo "Required file is missing: $file" >&2
    exit 1
  fi
done

openssl x509 -in "$root_ca_source" -noout >/dev/null
grep -q '^VAULT_ROLE_ID=' "$environment_source"
grep -q '^VAULT_SECRET_ID=' "$environment_source"

install -o root -g root -m 0644 \
  "$root_ca_source" \
  /usr/local/share/ca-certificates/dsqr-home-root-ca.crt
update-ca-certificates

install -o root -g root -m 0600 \
  "$environment_source" \
  /etc/proxmox-vault-pki.env
install -o root -g root -m 0755 \
  "$script_directory/renew-vault-certificate.sh" \
  /usr/local/sbin/proxmox-vault-certificate
install -o root -g root -m 0644 \
  "$script_directory/proxmox-vault-certificate.service" \
  /etc/systemd/system/proxmox-vault-certificate.service
install -o root -g root -m 0644 \
  "$script_directory/proxmox-vault-certificate.timer" \
  /etc/systemd/system/proxmox-vault-certificate.timer

curl --silent --show-error \
  --cacert /etc/ssl/certs/ca-certificates.crt \
  --connect-timeout 5 \
  --max-time 15 \
  --output /dev/null \
  https://vault.service.home.arpa:8200/v1/sys/health

systemctl daemon-reload

cat <<'EOF'
Installed the Proxmox Vault PKI renewal service without changing the active certificate.

Run the first issuance explicitly:
  systemctl start proxmox-vault-certificate.service
  systemctl status --no-pager proxmox-vault-certificate.service

After verifying the new certificate remotely, enable the renewal timer:
  systemctl enable --now proxmox-vault-certificate.timer
EOF
