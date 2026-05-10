# GitOps

This directory is the desired-state layer Argo CD will reconcile after Pulumi bootstraps the `argocd` namespace and Argo CD Helm release.

Current split:

- Pulumi/Haven bootstraps cluster platform dependencies and installs Argo CD.
- Argo CD reads this directory and manages platform add-ons plus dsqr.dev application deployments.
- Helm remains the package format for apps.
- Kustomize composes the cluster/environment manifests that define Argo CD projects and application generation.
- Argo CD remains reachable on the LAN through the cluster ingress during this migration slice.

The remaining platform handoff plan lives in [platform-migration.md](platform-migration.md).

The first migration slice intentionally does not auto-sync generated platform applications. That lets the existing Pulumi-owned platform Helm releases remain live until we cut over deliberately.

The root `homelab` application auto-syncs the GitOps control layer itself: namespace, projects, and ApplicationSets. Generated app workloads auto-sync after their Pulumi Helm release ownership has moved to Argo CD. Generated platform applications remain manual until platform ownership moves away from Pulumi.

Ownership split:

- `platform` project: cluster add-ons such as Cilium, MetalLB, Traefik, and observability exporters/monitors.
- `dsqr` project: app workloads in `dsqr` and `twt`.
- Argo CD itself is still bootstrapped by Pulumi; self-management can come after the first safe sync.

Render locally:

```sh
kubectl kustomize gitops/bootstrap
kubectl kustomize gitops/clusters/homelab
```

Stamp app Helm values with immutable image tags after CI has published `sha-<commit>` images:

```sh
npm run gitops:tag-images -- --tag sha-<commit> dotdev-labs
npm run gitops:tag-images -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
nix run .#gitopsTagImages -- --tag sha-<commit> dotdev-labs
nix run .#gitopsTagImages -- --tag sha-<commit> dotdev-web dotdev-studio dotdev-labs
```

The Tastings with Tay charts can be pinned the same way only after matching image tags exist for those repositories.

The `Publish Images` workflow publishes `latest` plus `sha-<commit>` images for the dsqr apps, then commits the matching Helm value and ApplicationSet metadata updates back to the same branch. Argo CD polls Git every `120s` plus up to `60s` jitter and auto-syncs app workload changes.

Bootstrap after Argo CD is installed:

```sh
kubectl apply -k gitops/bootstrap
```

Cutover plan:

1. Preview and install Argo CD with `npm run infra:k8s:preview` and `npm run infra:k8s:up`.
2. Preview and apply the Cloudflare stack for the existing public app hostnames.
3. Apply `gitops/bootstrap` so Argo CD sees the `homelab` root application.
4. Sync `homelab` so the `dsqr-apps` and `platform-addons` ApplicationSets create one Argo CD app per service/add-on.
5. Cut over `dotdev-labs` first by disabling or removing the matching Pulumi-owned Helm release.
6. Manually sync `dotdev-labs` once its diff is understood.
7. Repeat the same ownership move for the remaining app releases.
8. Keep platform applications manual until their Pulumi ownership is removed.
