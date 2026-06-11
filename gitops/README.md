# GitOps Runbook

This directory is the desired-state layer for the homelab cluster after Cilium and Argo CD bootstrap.

## Ownership

- Pulumi/Haven owns out-of-cluster infrastructure and the Argo CD bootstrap release.
- A new cluster needs Cilium seeded before normal Argo CD pods can run.
- Argo CD owns Kubernetes desired state from `gitops/` after bootstrap, including Cilium day-2 reconciliation.
- Helm owns application manifests.
- Kustomize composes the GitOps control layer.
- Runtime secret values are not committed. Create them with `kubectl`.

## Argo Flow

1. `gitops/clusters/homelab/bootstrap/argocd-app-of-apps.yaml` creates the root `homelab` Argo application.
2. `homelab` points at `gitops/clusters/homelab/applications`.
3. `gitops/clusters/homelab/applications/kustomization.yaml` loads Argo CD control manifests, lists one generated Argo `Application` file per app, and owns cluster-local Application patches.
4. `gitops/templates/applications/<app>.yaml.tmpl` is the source template for each generated Application.
5. Helm-backed generated apps point at a chart plus values from `gitops/manifests/<app>/base` and `gitops/manifests/<app>/overlays/homelab`.
6. Kustomize-backed generated apps point at raw manifests under `gitops/manifests/<app>/overlays/homelab`.
7. Apps that target app/service namespaces use Argo CD `CreateNamespace=true` and `managedNamespaceMetadata` to declare namespace labels. Apps targeting existing core namespaces such as `kube-system` do not request namespace creation.

Private app repos need an Argo repository secret in `argocd`. Private GHCR images need an image pull secret in the app namespace. See `gitops/platform-migration.md` for the final platform ownership model and bootstrap notes.

Most examples are POSIX shell commands. In Nushell, wrap commands that use pipes, quotes, or `\` line continuations with `sh -lc '...'`.

## External Secrets Bootstrap

External Secrets Operator is split into two Argo apps:

- `external-secrets` installs the Helm chart, CRDs, webhook, cert controller, and service account.
- `external-secrets-config` applies the Vault `ClusterSecretStore` and shared `ClusterExternalSecret` resources.

The first managed secret is `ghcr-creds`, fanned out to namespaces labeled `homelab.dev/ghcr-pull=true` from Vault path `kv/homelab/platform/github/ghcr-pull`.

Seed the Vault KV path from a shell with `VAULT_ADDR` and `VAULT_TOKEN` already loaded:

```sh
read -rsp "GHCR read token: " GHCR_TOKEN
echo
vault kv put kv/homelab/platform/github/ghcr-pull \
  server=ghcr.io \
  username=0xdsqr \
  password="$GHCR_TOKEN" \
  email=not-used@dsqr.dev
unset GHCR_TOKEN
```

After Argo has synced `external-secrets`, wire Vault Kubernetes auth to the chart-managed service account:

```sh
kubectl -n external-secrets apply -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: vault-tokenreviewer
  annotations:
    kubernetes.io/service-account.name: external-secrets
type: kubernetes.io/service-account-token
EOF

K8S_HOST="$(kubectl config view --raw --minify -o jsonpath='{.clusters[0].cluster.server}')"
K8S_CA_CERT="$(mktemp)"
kubectl config view --raw --minify -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d >"$K8S_CA_CERT"
TOKEN_REVIEWER_JWT="$(kubectl -n external-secrets get secret vault-tokenreviewer -o jsonpath='{.data.token}' | base64 -d)"

vault auth enable kubernetes || true
vault write auth/kubernetes/config \
  token_reviewer_jwt="$TOKEN_REVIEWER_JWT" \
  kubernetes_host="$K8S_HOST" \
  kubernetes_ca_cert=@"$K8S_CA_CERT"
vault write auth/kubernetes/role/homelab-external-secrets \
  bound_service_account_names=external-secrets \
  bound_service_account_namespaces=external-secrets \
  policies=homelab-external-secrets \
  ttl=1h

rm -f "$K8S_CA_CERT"
unset TOKEN_REVIEWER_JWT
```

Then label target namespaces and sync `external-secrets-config`:

```sh
kubectl label namespace dsqr fidara twt homelab.dev/ghcr-pull=true --overwrite
kubectl -n argocd patch application external-secrets-config --type merge -p '{"operation":{"sync":{"prune":false}}}'
kubectl get clustersecretstore vault-homelab
kubectl get externalsecret -A | grep ghcr-creds
kubectl -n dsqr get secret ghcr-creds -o jsonpath='{.type}{"\n"}'
```

## Argo UI Shape

The app list should show separate app cards. That is intentional.

- `homelab` is the root bootstrap app. It owns the cluster GitOps composition.
- Platform and control apps stay separate: `argocd`, `cilium`, `metallb`, `metallb-config`, `traefik`, `metrics-server`, `kube-state-metrics`, and `k8s-monitoring`.
- Product apps stay separate: `dotdev-web`, `dotdev-studio`, `dotdev-labs`, `fidara`, `twt-web`, and `twt-admin`.

Do not collapse those generated apps into one large Argo app just to make the card view shorter. Separate apps give cleaner health, sync, rollback, and failure boundaries. Use Argo labels such as `app.kubernetes.io/part-of`, `homelab.dev/owner`, and `homelab.dev/tier` to filter/group the view.

Generated Application files are disposable. Change the app's template under `gitops/templates/applications/` or add/remove app resources in `gitops/clusters/homelab/applications/kustomization.yaml`, then run:

```sh
npm run gitops:generate
```

For cluster-local Application overrides, patch the generated Application from `gitops/clusters/homelab/applications/kustomization.yaml`; the file contains a commented JSON6902 example. For Helm values, prefer `gitops/manifests/<app>/overlays/homelab/values-overrides.yaml`.

## Chart Ownership

- Charts for apps owned by `dsqr-dotdev` live in this repo under `helm/`.
- Charts for apps owned by another app repo live beside that app code. For example, `fidara` charts live in `0xdsqr/fidara`, and Tastings with Tay charts live in `0xdsqr/tastingswithtay`.
- `gitops/` should reference those repos through generated Application entries. It should not copy external app charts unless this repo becomes the owner of that app.
- Kustomize composes Argo bootstrap, projects, and Applications. Helm renders app workloads.

## Local Render Checks

```sh
npm run gitops:generate
kubectl kustomize gitops/clusters/homelab/bootstrap
kubectl kustomize gitops/clusters/homelab/applications
kubectl kustomize gitops/manifests/metrics-server/overlays/homelab
kubectl kustomize gitops/manifests/metallb/overlays/homelab
```

## Root Sync Commands

Create or repair the root app:

```sh
kubectl apply -k gitops/clusters/homelab/bootstrap
```

Ask Argo to reread Git:

```sh
kubectl -n argocd annotate application homelab argocd.argoproj.io/refresh=hard --overwrite
```

Force a root sync and prune:

```sh
kubectl -n argocd patch application homelab --type merge -p '{"operation":{"sync":{"prune":true}}}'
```

Watch root state:

```sh
kubectl -n argocd get application homelab -w
```

## App Check Commands

List apps:

```sh
kubectl -n argocd get application
```

Inspect one app:

```sh
kubectl -n argocd describe application <app-name>
```

Force a single app refresh and sync:

```sh
kubectl -n argocd annotate application <app-name> argocd.argoproj.io/refresh=hard --overwrite
kubectl -n argocd patch application <app-name> --type merge -p '{"operation":{"sync":{"prune":true}}}'
kubectl -n argocd get application <app-name> -w
```

Check deployed resources:

```sh
kubectl -n <namespace> get pods,svc,ingress,networkpolicy
kubectl -n <namespace> rollout status deployment/<deployment-name>
kubectl -n <namespace> describe pod <pod-name>
kubectl -n <namespace> logs deployment/<deployment-name>
```

## Resource Metrics

`metrics-server` provides the Kubernetes `metrics.k8s.io` API used by `kubectl top` and HPA resource metrics. `kube-state-metrics` and `k8s-monitoring` are observability/exporter pieces, not a replacement for Metrics Server.

After syncing the `metrics-server` Application:

```sh
kubectl top nodes
kubectl top pods -A
```

## Private Repo Access

Create an Argo repository secret for a private GitHub repo:

```sh
kubectl -n argocd create secret generic <app>-repo \
  --from-literal=type=git \
  --from-literal=url=https://github.com/0xdsqr/<repo>.git \
  --from-literal=username=0xdsqr \
  --from-literal=password="$GITHUB_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n argocd label secret <app>-repo argocd.argoproj.io/secret-type=repository --overwrite
```

Check it:

```sh
kubectl -n argocd get secret <app>-repo --show-labels
kubectl -n argocd annotate application <app-name> argocd.argoproj.io/refresh=hard --overwrite
```

## GHCR Pull Secret

Copy the shared GHCR pull secret into a new app namespace:

```sh
kubectl -n dsqr get secret ghcr-creds -o json \
  | jq '.metadata.namespace="<namespace>" | del(.metadata.uid,.metadata.resourceVersion,.metadata.creationTimestamp,.metadata.managedFields,.metadata.annotations)' \
  | kubectl apply -f -
```

Or create one directly:

```sh
kubectl -n <namespace> create secret docker-registry ghcr-creds \
  --docker-server=ghcr.io \
  --docker-username=0xdsqr \
  --docker-password="$GHCR_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Runtime Secrets

Charts should reference secret names. Secret values are created outside Git:

```sh
kubectl -n <namespace> create secret generic <secret-name> \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=EXAMPLE_KEY="$EXAMPLE_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -
```

After changing runtime secrets, restart workloads so pods receive the new env:

```sh
kubectl -n <namespace> rollout restart deployment/<deployment-name>
kubectl -n <namespace> rollout status deployment/<deployment-name>
```

### Runtime Secret Migration To Vault

Use this after `external-secrets` and `external-secrets-config` are healthy, before syncing app changes that point workloads at new per-app secret names. It copies the current Kubernetes secret values into per-app Vault KV paths without printing the secret values.

Start a Nu shell with Bao available:

```nu
nix shell nixpkgs#openbao nixpkgs#kubectl nixpkgs#jq -c nu
```

Copy the current shared dsqr secret into the three app-scoped Vault paths:

```nu
let dsqr_auth_secret = (kubectl -n dsqr get secret dotdev-web-secrets -o json | jq -r '.data.AUTH_SECRET | @base64d')
let dsqr_database_url = (kubectl -n dsqr get secret dotdev-web-secrets -o json | jq -r '.data.DATABASE_URL | @base64d')
let dsqr_resend_api_key = (kubectl -n dsqr get secret dotdev-web-secrets -o json | jq -r '.data.RESEND_API_KEY | @base64d')
let dsqr_s3_access_key = (kubectl -n dsqr get secret dotdev-web-secrets -o json | jq -r '.data.S3_ACCESS_KEY | @base64d')
let dsqr_s3_secret_key = (kubectl -n dsqr get secret dotdev-web-secrets -o json | jq -r '.data.S3_SECRET_KEY | @base64d')

for path in ["kv/homelab/apps/dsqr/dotdev-web" "kv/homelab/apps/dsqr/dotdev-studio" "kv/homelab/apps/dsqr/dotdev-labs"] {
  bao kv put $path $"AUTH_SECRET=($dsqr_auth_secret)" $"DATABASE_URL=($dsqr_database_url)" $"RESEND_API_KEY=($dsqr_resend_api_key)" $"S3_ACCESS_KEY=($dsqr_s3_access_key)" $"S3_SECRET_KEY=($dsqr_s3_secret_key)"
}

hide dsqr_auth_secret
hide dsqr_database_url
hide dsqr_resend_api_key
hide dsqr_s3_access_key
hide dsqr_s3_secret_key
```

Copy the current shared Tastings with Tay secret into the web/admin Vault paths:

```nu
let twt_auth_secret = (kubectl -n twt get secret twt-secrets -o json | jq -r '.data.AUTH_SECRET | @base64d')
let twt_database_url = (kubectl -n twt get secret twt-secrets -o json | jq -r '.data.DATABASE_URL | @base64d')
let twt_discord_client_secret = (kubectl -n twt get secret twt-secrets -o json | jq -r '.data.DISCORD_CLIENT_SECRET | @base64d')
let twt_s3_access_key = (kubectl -n twt get secret twt-secrets -o json | jq -r '.data.S3_ACCESS_KEY | @base64d')
let twt_s3_secret_key = (kubectl -n twt get secret twt-secrets -o json | jq -r '.data.S3_SECRET_KEY | @base64d')

for path in ["kv/homelab/apps/tastingswithtay/web" "kv/homelab/apps/tastingswithtay/admin"] {
  bao kv put $path $"AUTH_SECRET=($twt_auth_secret)" $"DATABASE_URL=($twt_database_url)" $"DISCORD_CLIENT_SECRET=($twt_discord_client_secret)" $"S3_ACCESS_KEY=($twt_s3_access_key)" $"S3_SECRET_KEY=($twt_s3_secret_key)"
}

hide twt_auth_secret
hide twt_database_url
hide twt_discord_client_secret
hide twt_s3_access_key
hide twt_s3_secret_key
```

Verify the Vault paths by checking keys only:

```nu
for path in ["kv/homelab/apps/dsqr/dotdev-web" "kv/homelab/apps/dsqr/dotdev-studio" "kv/homelab/apps/dsqr/dotdev-labs" "kv/homelab/apps/tastingswithtay/web" "kv/homelab/apps/tastingswithtay/admin"] {
  print $"--- ($path) ---"
  bao kv get -format=json $path | jq -r '.data.data | keys[]'
}
```

After the matching Argo apps are synced and healthy, the old shared `twt/twt-secrets` secret can be deleted. Do not delete `dsqr/dotdev-web-secrets`; it remains the scoped web secret and is adopted by External Secrets.

## Onboard A New Service

1. Add or verify the service Helm chart.
2. Keep reusable chart defaults in the chart.
3. Add production values with immutable `sha-<commit>` image tags under `gitops/manifests/<app>/base` or the owning external app repo.
4. Add the service repo to the right AppProject `sourceRepos` if it is outside `dsqr-dotdev`.
5. Add the namespace to the AppProject destinations.
6. Add common values under `gitops/manifests/<app>/base` and homelab overrides under `gitops/manifests/<app>/overlays/homelab`.
7. Add `gitops/templates/applications/<app>.yaml.tmpl`.
8. Add `<app>.yaml` to `gitops/clusters/homelab/applications/kustomization.yaml`.
9. Run `npm run gitops:generate`.
10. Add Cloudflare DNS and tunnel routes in `infra/inventory/cloudflare.ts`.
11. Run Cloudflare preview and apply.
12. Create Argo repo credentials if the source repo is private.
13. Sync `homelab` so the generated app appears.
14. Create the namespace runtime secrets and `ghcr-creds`.
15. Sync the generated app and verify pods, ingress, and health endpoints.

## Image Tags

Use immutable image tags in production. For dsqr-dotdev apps:

```sh
npm run gitops:tag-images -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
nix run .#gitopsTagImages -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
```

For external app repos, update the app chart `values-prod.yaml` in that repo and keep the matching `gitops/templates/applications/<app>.yaml.tmpl` image metadata aligned, then regenerate.

## Current Fidara Smoke Checks

```sh
kubectl -n argocd get application fidara
kubectl -n fidara get pods,svc,ingress,networkpolicy
curl -I https://fidara.io/healthz
curl -I https://api.fidara.io/healthz
curl -i 'https://api.fidara.io/api/v1/organizations?limit=1'
```

The last command should return `401` without an API key.

## Argo UI

```text
http://argocd.dsqr.dev
```

Get the initial admin password if it has not been rotated:

```sh
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```
