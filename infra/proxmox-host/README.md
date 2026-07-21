# Proxmox listener certificate

This bundle installs a Vault-issued certificate for
`proxmox.dell-r730xd.home.arpa` on the Proxmox `pveproxy` listener. It uses the
least-privilege `proxmox-dell-r730xd-listener-renewer` AppRole declared by the
Vault Pulumi stack.

The renewal script validates the requested hostname, CA chain, certificate
expiry, and public/private key match before calling Proxmox's supported
`pvenode cert set` interface. It checks daily and renews within seven days of
expiry. The first issuance is intentionally manual.

## Bootstrap

From a trusted Nushell with `VAULT_ADDR` and `VAULT_TOKEN` set:

```nu
let vault_role_id = (
  curl --silent --show-error --fail-with-body
    --header $"X-Vault-Token: ($env.VAULT_TOKEN)"
    $"($env.VAULT_ADDR)/v1/auth/approle/role/proxmox-dell-r730xd-listener-renewer/role-id"
  | from json
  | get data.role_id
)

let vault_secret_id = (
  curl --silent --show-error --fail-with-body
    --request POST
    --header $"X-Vault-Token: ($env.VAULT_TOKEN)"
    $"($env.VAULT_ADDR)/v1/auth/approle/role/proxmox-dell-r730xd-listener-renewer/secret-id"
  | from json
  | get data.secret_id
)

$"VAULT_ROLE_ID=($vault_role_id)\nVAULT_SECRET_ID=($vault_secret_id)\n"
| save --force /tmp/proxmox-vault-pki.env
chmod 600 /tmp/proxmox-vault-pki.env
```

Copy the public root CA, this directory, and the generated AppRole credentials
to the Proxmox node:

```sh
scp -r infra/proxmox-host root@10.10.10.109:/root/
scp ~/nixos-config/certs/dsqr-home-root-ca.pem root@10.10.10.109:/root/
scp /tmp/proxmox-vault-pki.env root@10.10.10.109:/root/
```

Run on the Proxmox node as root:

```sh
apt-get update
apt-get install --yes ca-certificates curl jq openssl
cd /root/proxmox-host
./install.sh /root/dsqr-home-root-ca.pem /root/proxmox-vault-pki.env
systemctl start proxmox-vault-certificate.service
systemctl status --no-pager proxmox-vault-certificate.service
pvenode cert info
rm -f /root/proxmox-vault-pki.env
```

Verify from a trusted workstation before enabling renewal:

```sh
curl --silent --show-error --output /dev/null \
  --write-out '%{http_code} %{ssl_verify_result}\n' \
  https://proxmox.dell-r730xd.home.arpa:8006/api2/json/version
```

An unauthenticated API request returns HTTP `401`; TLS verification must be `0`.
Then enable the timer on the Proxmox node:

```sh
systemctl enable --now proxmox-vault-certificate.timer
systemctl list-timers proxmox-vault-certificate.timer
```

Remove the temporary local credential copy after the service succeeds:

```sh
rm -f /tmp/proxmox-vault-pki.env
```

The first renewal preserves the previous certificate and key under
`/var/lib/proxmox-vault-pki/bootstrap-backup`. To roll back from the Proxmox
console:

```sh
pvenode cert set \
  /var/lib/proxmox-vault-pki/bootstrap-backup/pveproxy-ssl.pem \
  /var/lib/proxmox-vault-pki/bootstrap-backup/pveproxy-ssl.key \
  --force 1 \
  --restart 1
```

Do not commit `/tmp/proxmox-vault-pki.env`. Rotate its SecretID if the file is
exposed.
