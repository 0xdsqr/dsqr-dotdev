# GitOps Runbook

This directory is the desired-state layer for the homelab cluster after Pulumi/Haven installs Argo CD.

## Ownership

- Pulumi/Haven owns cluster bootstrapping, Cloudflare DNS, and Cloudflare tunnel routes.
- Argo CD owns Kubernetes desired state from `gitops/`.
- Helm owns application manifests.
- Kustomize composes the GitOps control layer.
- Runtime secret values are not committed. Create them with `kubectl`.

## Argo Flow

1. `gitops/bootstrap/homelab-root-application.yaml` creates the root `homelab` Argo application.
2. `homelab` points at `gitops/clusters/homelab`.
3. `gitops/clusters/homelab/kustomization.yaml` loads namespaces, projects, and ApplicationSets.
4. `dsqr-apps.applicationset.yaml` renders one Argo application per app.
5. Each generated app points at a Helm chart and `values-prod.yaml`.
6. Argo syncs the chart into the target namespace, creates the namespace, prunes removed resources, and self-heals drift.

Private app repos need an Argo repository secret in `argocd`. Private GHCR images need an image pull secret in the app namespace.

Most examples are POSIX shell commands. In Nushell, wrap commands that use pipes, quotes, or `\` line continuations with `sh -lc '...'`.

## Argo UI Shape

The app list should show separate app cards. That is intentional.

- `homelab` is the root bootstrap app. It owns the cluster GitOps composition.
- `platform-addons` is an ApplicationSet for cluster add-ons such as Cilium, MetalLB, Traefik, and observability.
- `dsqr-apps` is an ApplicationSet for product apps.
- Generated product apps stay separate: `dotdev-web`, `dotdev-studio`, `dotdev-labs`, `fidara`, `twt-web`, and `twt-admin`.

Do not collapse those generated apps into one large Argo app just to make the card view shorter. Separate apps give cleaner health, sync, rollback, and failure boundaries. Use Argo labels such as `app.kubernetes.io/part-of`, `homelab.dev/owner`, and `homelab.dev/tier` to filter/group the view.

Both ApplicationSets set `preserveResourcesOnDeletion: true` so a future AppSet rename or cleanup is less likely to remove live workloads unexpectedly. Still treat AppSet renames as a planned change and preview them before syncing.

## Chart Ownership

- Charts for apps owned by `dsqr-dotdev` live in this repo under `helm/`.
- Charts for apps owned by another app repo live beside that app code. For example, `fidara` charts live in `0xdsqr/fidara`, and Tastings with Tay charts live in `0xdsqr/tastingswithtay`.
- `gitops/` should reference those repos through ApplicationSet entries. It should not copy external app charts unless this repo becomes the owner of that app.
- Kustomize composes Argo bootstrap, projects, and ApplicationSets. Helm renders app workloads.

## Local Render Checks

```sh
kubectl kustomize gitops/bootstrap
kubectl kustomize gitops/clusters/homelab
```

## Root Sync Commands

Create or repair the root app:

```sh
kubectl apply -k gitops/bootstrap
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

List generated apps:

```sh
kubectl -n argocd get application
kubectl -n argocd get applicationset dsqr-apps
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

## Onboard A New Service

1. Add or verify the service Helm chart.
2. Add production values with immutable `sha-<commit>` image tags.
3. Add ingress hostnames and network policies in the chart.
4. Add the service repo to the right AppProject `sourceRepos` if it is outside `dsqr-dotdev`.
5. Add the namespace to the AppProject destinations.
6. Add an element to `gitops/clusters/homelab/applications/dsqr-apps.applicationset.yaml`.
7. Add Cloudflare DNS and tunnel routes in `infra/inventory/cloudflare.ts`.
8. Run Cloudflare preview and apply.
9. Create Argo repo credentials if the source repo is private.
10. Sync `homelab` so the generated app appears.
11. Create the namespace runtime secrets and `ghcr-creds`.
12. Sync the generated app and verify pods, ingress, and health endpoints.

## Image Tags

Use immutable image tags in production. For dsqr-dotdev apps:

```sh
npm run gitops:tag-images -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
nix run .#gitopsTagImages -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
```

For external app repos, update the app chart `values-prod.yaml` in that repo and keep the ApplicationSet `imageTag` metadata aligned.

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
