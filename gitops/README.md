# GitOps Runbook

This directory is the desired-state layer for the `hub-a` Kubernetes cluster in the homelab environment after Cilium and Argo CD bootstrap.

## Naming Model

- `hub-a` is the Kubernetes cluster identity used by GitOps, Cilium, and cluster telemetry.
- `homelab` is the physical site and environment used by Vault paths, Tailscale tags, private DNS, and the `homelab.dev/*` metadata namespace.
- `dell-r730xd` identifies the current physical host beneath the cluster; it is metadata rather than part of the durable cluster name.
- The Pulumi project/stack remains `kubernetes/dev`; changing it would be a state migration, not a cluster rename.
- Existing `k8s-main-*` VM and node names remain stable because renaming them would require a separate host, certificate, and Pulumi state migration.

## Ownership

- Pulumi/Haven owns out-of-cluster infrastructure, the `argocd` namespace, and the Argo CD bootstrap release.
- A new cluster needs Cilium seeded before normal Argo CD pods can run.
- Argo CD owns Kubernetes desired state from `gitops/` after bootstrap, including Cilium day-2 reconciliation.
- Helm owns application manifests.
- Kustomize composes the GitOps control layer.
- Runtime secret values are not committed. Create them with `kubectl`.

The Argo CD values under `gitops/manifests/argocd/` remain Pulumi Helm inputs; they do not define an Argo CD self-management Application.

## Argo Flow

1. `gitops/clusters/hub-a/bootstrap/argocd-app-of-apps.yaml` creates the root `hub-a` Argo application.
2. `hub-a` points at `gitops/clusters/hub-a/applications`.
3. `gitops/clusters/hub-a/applications/kustomization.yaml` loads the Argo CD AppProjects, lists one generated Argo `Application` file per Argo-owned app, and owns cluster-local Application patches.
4. `gitops/templates/applications/<app>.yaml.tmpl` is the source template for each generated Application.
5. Helm-backed generated apps point at a chart plus values from `gitops/manifests/<app>/base` and `gitops/manifests/<app>/overlays/hub-a`.
6. Kustomize-backed generated apps point at raw manifests under `gitops/manifests/<app>/overlays/hub-a`.
7. Apps that target app/service namespaces use Argo CD `CreateNamespace=true` and `managedNamespaceMetadata` to declare namespace labels. Apps targeting existing core namespaces such as `kube-system` do not request namespace creation.

Private app repos need an Argo repository secret in `argocd`. Private GHCR images need an image pull secret in the app namespace. See `gitops/platform-migration.md` for the final platform ownership model and bootstrap notes.

Most examples are POSIX shell commands. In Nushell, wrap commands that use pipes, quotes, or `\` line continuations with `sh -lc '...'`.

## External Secrets Bootstrap

External Secrets Operator is split into two Argo apps:

- `external-secrets` installs the Helm chart, CRDs, webhook, cert controller, and service account.
- `external-secrets-config` applies the Vault `ClusterSecretStore` and shared `ClusterExternalSecret` resources.

The first managed secret is `ghcr-creds`, fanned out to namespaces labeled `homelab.dev/ghcr-pull=true` from Vault path `kv/homelab/platform/github/ghcr-pull`.

Bootstrap order:

1. Sync `external-secrets` so the controller, webhook, service account, and CRDs exist.
2. Configure Vault Kubernetes auth from a trusted operator shell.
3. Seed required platform secret values into Vault out of band.
4. Sync `external-secrets-config` so `ClusterSecretStore` and shared fanout secrets reconcile.
5. Verify the store is ready, then verify namespace-local `ExternalSecret` resources are ready.

The live Vault auth and secret-seeding commands are intentionally kept out of the public runbook.

## Argo UI Shape

The app list should show separate app cards. That is intentional.

- `hub-a` is the root bootstrap app. It owns the cluster GitOps composition.
- Platform and control apps stay separate: `cilium`, `metallb`, `metallb-config`, `traefik`, `metrics-server`, `kube-state-metrics`, and `k8s-monitoring`.
- Product apps stay separate: `dotdev-web`, `dotdev-studio`, `dotdev-labs`, `fidara`, `twt-web`, and `twt-admin`.

Argo CD itself does not have an Application card. Pulumi/Haven owns its namespace and Helm release so the GitOps controller does not reconcile or delete its own installation.

Do not collapse those generated apps into one large Argo app just to make the card view shorter. Separate apps give cleaner health, sync, rollback, and failure boundaries. Use Argo labels such as `app.kubernetes.io/part-of`, `homelab.dev/owner`, and `homelab.dev/tier` to filter/group the view.

Generated Application files are disposable. Change the app's template under `gitops/templates/applications/` or add/remove app resources in `gitops/clusters/hub-a/applications/kustomization.yaml`, then run:

```sh
npm run gitops:generate
```

For cluster-local Application overrides, patch the generated Application from `gitops/clusters/hub-a/applications/kustomization.yaml`; the file contains a commented JSON6902 example. For Helm values, prefer `gitops/manifests/<app>/overlays/hub-a/values-overrides.yaml`.

## Chart Ownership

- Charts for apps owned by `dsqr-dotdev` live in this repo under `helm/`.
- Charts for apps owned by another app repo live beside that app code. For example, `fidara` charts live in `0xdsqr/fidara`, and Tastings with Tay charts live in `0xdsqr/tastingswithtay`.
- `gitops/` should reference those repos through generated Application entries. It should not copy external app charts unless this repo becomes the owner of that app.
- Kustomize composes Argo bootstrap, projects, and Applications. Helm renders app workloads.

## Local Render Checks

```sh
npm run gitops:generate
kubectl kustomize gitops/clusters/hub-a/bootstrap
kubectl kustomize gitops/clusters/hub-a/applications
kubectl kustomize gitops/manifests/metrics-server/overlays/hub-a
kubectl kustomize gitops/manifests/metallb/overlays/hub-a
```

## Root Sync Commands

Create or repair the root app:

```sh
kubectl apply -k gitops/clusters/hub-a/bootstrap
```

Ask Argo to reread Git:

```sh
kubectl -n argocd annotate application hub-a argocd.argoproj.io/refresh=hard --overwrite
```

Force a root sync and prune:

```sh
kubectl -n argocd patch application hub-a --type merge -p '{"operation":{"sync":{"prune":true}}}'
```

Watch root state:

```sh
kubectl -n argocd get application hub-a -w
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

Argo CD private repository credentials are runtime secrets. Keep token material out of this repo and manage the rendered Kubernetes repository secrets through the platform secret flow.

## GHCR Pull Secret

`ghcr-creds` is owned by External Secrets. Namespaces that need private GHCR pulls carry `homelab.dev/ghcr-pull=true`; the cluster-level ExternalSecret fanout renders the namespace-local docker config secret.

## Runtime Secrets

Application charts reference Kubernetes secret names only. Secret values live outside Git and are rendered by External Secrets from Vault.

Runtime app secrets are scoped per workload where possible. Shared infrastructure credentials stay in platform-level paths only when the credential is genuinely shared, such as GHCR pull access.

Safe migration shape:

1. Seed the target Vault path from a trusted shell or one-off local helper.
2. Sync the owning Argo application only after the Vault path exists.
3. Check the `ExternalSecret` readiness condition, then verify the rendered Kubernetes `Secret`.
4. Restart or roll workloads only when the chart consumes the secret through environment variables and the pod template did not otherwise change.
5. Remove legacy manually-created secrets only after the replacement is healthy and owned by External Secrets.

Live migration commands are intentionally kept out of the public runbook.

## Onboard A New Service

1. Add or verify the service Helm chart.
2. Keep reusable chart defaults in the chart.
3. Add production Helm values with immutable `sha-<commit>` image tags under the owning app chart's `values-prod.yaml`.
4. Add the service repo to the right AppProject `sourceRepos` if it is outside `dsqr-dotdev`.
5. Add the namespace to the AppProject destinations.
6. Add GitOps-owned resources under `gitops/manifests/<app>/base` and `hub-a` overrides under `gitops/manifests/<app>/overlays/hub-a`.
7. Add `gitops/templates/applications/<app>.yaml.tmpl`.
8. Add `<app>.yaml` to `gitops/clusters/hub-a/applications/kustomization.yaml`.
9. Run `npm run gitops:generate`.
10. Add Cloudflare DNS and tunnel routes in `infra/inventory/cloudflare.ts`.
11. Run Cloudflare preview and apply.
12. Create Argo repo credentials if the source repo is private.
13. Sync `hub-a` so the generated app appears.
14. Create the namespace runtime secrets and `ghcr-creds`.
15. Sync the generated app and verify pods, ingress, and health endpoints.

## Image Tags

Use immutable image tags in production. For dsqr-dotdev apps:

```sh
npm run gitops:tag-images -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
nix run .#gitopsTagImages -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
```

For app repos that own their chart, update that chart's `values-prod.yaml` and keep the matching `gitops/templates/applications/<app>.yaml.tmpl` image metadata aligned, then regenerate.

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
https://argocd.home.arpa
```

Get the initial admin password if it has not been rotated:

```sh
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```
