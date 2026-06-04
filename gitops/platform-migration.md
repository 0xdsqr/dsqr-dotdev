# Platform GitOps Migration Plan

This plan moves the remaining Kubernetes platform resources from Pulumi day-2 ownership to Argo CD while keeping the cluster live.

Desired end state:

- Pulumi keeps bootstrapping enough Kubernetes infrastructure to recover Argo CD.
- Argo CD owns application workloads.
- Argo CD gradually owns platform add-ons.
- Helm remains the package format for upstream add-ons.
- Kustomize owns cluster composition, Argo projects, ApplicationSets, and raw Kubernetes resources that are not Helm chart values.

## Current Ownership

| Surface | Current owner | Desired owner | Notes |
| --- | --- | --- | --- |
| `dotdev-web`, `dotdev-studio`, `dotdev-labs` | Argo CD | Argo CD | Automated sync enabled. Images are pinned by CI to immutable `sha-*` tags. |
| `twt-web`, `twt-admin` | Argo CD | Argo CD | Automated sync enabled. Charts and image publishing now live in the `tastingswithtay` repo. |
| `argocd` Helm release | Pulumi | Pulumi for now | Keep as recovery bootstrap until platform handoff is stable. |
| Namespaces | Pulumi and GitOps | Argo CD eventually | GitOps already declares `argocd`; Pulumi still creates runtime namespaces. |
| `kube-state-metrics` | Pulumi | Argo CD | Lowest-risk platform handoff candidate. |
| `k8s-monitoring` | Pulumi | Argo CD | Move after `kube-state-metrics`. |
| `traefik` | Pulumi | Argo CD | Move after observability, during a maintenance window. |
| `metallb` Helm release | Pulumi | Argo CD | Move after Traefik plan is proven. |
| MetalLB `IPAddressPool` / `L2Advertisement` | Pulumi | Argo CD via Kustomize | Must be modeled as raw manifests before handoff. |
| `cilium` | Pulumi | Argo CD later, or Pulumi long-term | Highest-risk component because it is the CNI. |

## GitOps Layout Rules

Use the existing split:

- `gitops/bootstrap`: only the root Argo CD `homelab` Application.
- `gitops/clusters/homelab`: cluster-specific Kustomize root.
- `gitops/clusters/homelab/applications`: Argo `ApplicationSet` definitions.
- `infra/inventory/values/kubernetes`: Helm values used by both Pulumi today and Argo platform apps.

Add this when moving raw platform objects:

```txt
gitops/clusters/homelab/platform/
  metallb-config/
    kustomization.yaml
    ipaddresspool-ingress.yaml
    l2advertisement-ingress.yaml
```

Then add a small Argo `Application` or `ApplicationSet` entry for `metallb-config`. Do not bury these CRs inside Helm chart values; they are cluster policy, not chart configuration.

## Handoff Pattern

Every platform component should use the same no-delete migration pattern:

1. Confirm the Argo app exists and is `OutOfSync Healthy`.
2. Compare Argo desired state with live resources in the UI.
3. Commit a repo change that disables the Pulumi resource for that component.
4. Pull that commit on the VM.
5. Remove the resource from Pulumi state with `pulumi state delete`, so Pulumi forgets it without deleting live Kubernetes objects.
6. Run `npm run infra:k8s:preview`; it must not plan a delete or recreate for the handed-off component.
7. Sync only that Argo application.
8. Verify pods, services, and ingress/LB behavior.
9. Run `npm run infra:k8s:preview` again; Pulumi should remain quiet.

Do not use `pulumi up` to delete a live platform release during handoff. The safe move is state deletion plus code removal, then Argo adoption.

## Migration Order

### 0. Clean Pulumi State Warning

Clear the old interrupted `dotdevLabs` pending operation before touching more platform resources:

```sh
cd ~/dsqr-dotdev/.haven/pulumi/kubernetes
pulumi stack select dev
pulumi refresh
```

Then verify:

```sh
cd ~/dsqr-dotdev
npm run infra:k8s:preview
```

Expected result: no app releases in Pulumi outputs and no pending-operation warning.

### 1. Kube State Metrics

Risk: low.

Repo change:

- Set `helmReleases.kubeStateMetrics.enabled = false` in `infra/inventory/kubernetes.ts`.
- Keep `gitops/clusters/homelab/applications/platform-addons.applicationset.yaml` manual.

VM cutover:

```sh
cd ~/dsqr-dotdev/.haven/pulumi/kubernetes
pulumi stack select dev
pulumi state delete 'urn:pulumi:dev::kubernetes::kubernetes:helm.sh/v3:Release::kubeStateMetrics'

cd ~/dsqr-dotdev
npm run infra:k8s:preview
kubectl -n argocd patch application kube-state-metrics --type merge -p '{"operation":{"sync":{"syncOptions":["ApplyOutOfSyncOnly=true"]}}}'
kubectl -n argocd get application kube-state-metrics -w
kubectl -n kube-system get deploy,svc,pod -l app.kubernetes.io/instance=kube-state-metrics
```

Success criteria:

- Argo shows `kube-state-metrics` as `Synced Healthy`.
- Pulumi preview does not recreate or delete `kubeStateMetrics`.

### 2. K8s Monitoring

Risk: medium. It depends on observability endpoints outside the cluster.

Repo change:

- Set `helmReleases.k8sMonitoring.enabled = false`.
- Keep sync manual until the first post-cutover telemetry check is clean.

VM cutover:

```sh
cd ~/dsqr-dotdev/.haven/pulumi/kubernetes
pulumi stack select dev
pulumi state delete 'urn:pulumi:dev::kubernetes::kubernetes:helm.sh/v3:Release::k8sMonitoring'

cd ~/dsqr-dotdev
npm run infra:k8s:preview
kubectl -n argocd patch application k8s-monitoring --type merge -p '{"operation":{"sync":{"syncOptions":["ApplyOutOfSyncOnly=true"]}}}'
kubectl -n argocd get application k8s-monitoring -w
kubectl -n observability get deploy,daemonset,statefulset,svc,pod
```

Success criteria:

- `k8s-monitoring` is `Synced Healthy`.
- The `otel-collector` service still exists.
- Apps can still export OTLP traces to `observability.svc.cluster.local`.

### 3. Traefik

Risk: high because this serves app and Argo ingress.

Before handoff:

- Confirm `argocd.dsqr.dev`, `dsqr.dev`, `studio.dsqr.dev`, `labs.dsqr.dev`, and TWT hostnames work.
- Confirm the Traefik service is still assigned `10.10.30.200`.
- Keep another terminal ready with `kubectl -n traefik get svc,pod -w`.

Repo change:

- Set `helmReleases.traefik.enabled = false`.

VM cutover:

```sh
cd ~/dsqr-dotdev/.haven/pulumi/kubernetes
pulumi stack select dev
pulumi state delete 'urn:pulumi:dev::kubernetes::kubernetes:helm.sh/v3:Release::traefik'

cd ~/dsqr-dotdev
npm run infra:k8s:preview
kubectl -n argocd patch application traefik --type merge -p '{"operation":{"sync":{"syncOptions":["ApplyOutOfSyncOnly=true"]}}}'
kubectl -n argocd get application traefik -w
kubectl -n traefik get deploy,svc,pod
kubectl -n dsqr get ingress
```

Success criteria:

- `traefik` is `Synced Healthy`.
- Traefik service still has a MetalLB address.
- Argo UI is still reachable.
- App ingresses still work.

### 4. MetalLB Chart and Config

Risk: high because it provides LoadBalancer IPs.

First repo change:

- Add Kustomize resources for:
  - `IPAddressPool/ingress`
  - `L2Advertisement/ingress`
- Add an Argo app for `metallb-config`.
- Leave `metallb` chart app manual.

Then cut over the chart:

```sh
cd ~/dsqr-dotdev/.haven/pulumi/kubernetes
pulumi stack select dev
pulumi state delete 'urn:pulumi:dev::kubernetes::kubernetes:helm.sh/v3:Release::metallb'

cd ~/dsqr-dotdev
npm run infra:k8s:preview
kubectl -n argocd patch application metallb --type merge -p '{"operation":{"sync":{"syncOptions":["ApplyOutOfSyncOnly=true"]}}}'
kubectl -n argocd get application metallb -w
```

Then cut over raw config resources:

```sh
cd ~/dsqr-dotdev/.haven/pulumi/kubernetes
pulumi state delete 'urn:pulumi:dev::kubernetes::kubernetes:apiextensions.k8s.io/v1:CustomResource::metallb-ipaddresspool-ingress'
pulumi state delete 'urn:pulumi:dev::kubernetes::kubernetes:apiextensions.k8s.io/v1:CustomResource::metallb-l2advertisement-ingress'

cd ~/dsqr-dotdev
kubectl -n argocd patch application metallb-config --type merge -p '{"operation":{"sync":{"syncOptions":["ApplyOutOfSyncOnly=true"]}}}'
kubectl -n metallb-system get ipaddresspool,l2advertisement
kubectl -n traefik get svc
```

Success criteria:

- `metallb` and `metallb-config` are `Synced Healthy`.
- Traefik keeps `10.10.30.200`.
- No LoadBalancer service loses its external IP.

### 5. Cilium

Risk: very high. Cilium is the CNI and kube-proxy replacement.

Do not rush this. Options:

- Leave Cilium in Pulumi while Argo owns everything else.
- Move Cilium only in a maintenance window.
- Keep Cilium manual-sync forever, even after Argo owns it.

If moving:

```sh
cd ~/dsqr-dotdev/.haven/pulumi/kubernetes
pulumi stack select dev
pulumi state delete 'urn:pulumi:dev::kubernetes::kubernetes:helm.sh/v3:Release::cilium'

cd ~/dsqr-dotdev
npm run infra:k8s:preview
kubectl -n argocd patch application cilium --type merge -p '{"operation":{"sync":{"syncOptions":["ApplyOutOfSyncOnly=true"]}}}'
kubectl -n kube-system rollout status ds/cilium --timeout=10m
kubectl -n kube-system rollout status deploy/cilium-operator --timeout=10m
```

Success criteria:

- Nodes stay `Ready`.
- DNS works.
- Existing service traffic works.
- Argo remains reachable.

### 6. Argo CD Itself

Keep Argo CD Pulumi-owned until all other platform handoffs have soaked. After that, choose one:

- Keep Pulumi as Argo bootstrap forever.
- Move Argo CD to self-management with a disaster recovery note.

The conservative choice is to keep Pulumi responsible for Argo CD installation and use Argo for everything above it.

## Automation Policy

Recommended sync policy after migration:

| Surface | Sync mode |
| --- | --- |
| Apps | Automated with prune and self-heal. |
| Observability add-ons | Automated after one clean manual sync and soak. |
| Traefik | Manual, or automated only after repeated clean diffs. |
| MetalLB | Manual. |
| Cilium | Manual, or Pulumi-owned. |
| Argo CD | Pulumi-owned bootstrap for now. |

Platform apps should keep:

```yaml
syncOptions:
  - CreateNamespace=true
  - ApplyOutOfSyncOnly=true
```

Add `PruneLast=true` only when the first adoption sync is clean and the live resources are known to be fully represented in Git.

## Verification Commands

Global status:

```sh
kubectl -n argocd get applications
npm run infra:k8s:preview
```

Ingress path:

```sh
kubectl -n traefik get svc,pod
kubectl -n dsqr get ingress
kubectl -n twt get ingress
```

MetalLB:

```sh
kubectl -n metallb-system get ipaddresspool,l2advertisement
kubectl get svc --all-namespaces | grep LoadBalancer
```

Observability:

```sh
kubectl -n observability get deploy,daemonset,statefulset,svc,pod
kubectl -n kube-system get deploy,svc,pod -l app.kubernetes.io/instance=kube-state-metrics
```

Cilium:

```sh
kubectl get nodes
kubectl -n kube-system get ds,deploy,pod -l k8s-app=cilium
```

## Rollback

If Argo adoption fails before Pulumi code is removed from `master`, stop and do not prune. Pulumi can still recreate state from code.

If Pulumi code has already removed the component, rollback is:

1. Re-enable the component in `infra/inventory/kubernetes.ts`.
2. Run `npm run infra:k8s:preview`.
3. Run `npm run infra:k8s:up` only if the preview clearly recreates the expected release without deleting unrelated resources.
4. Disable or pause the matching Argo app before Pulumi resumes ownership.

For Traefik, MetalLB, and Cilium, prefer fixing forward if the live resources are still running. Avoid deletion-based rollback.

## References

- Argo CD multiple sources: https://argo-cd.readthedocs.io/en/stable/user-guide/multiple_sources/
- Argo CD Helm usage and value precedence: https://argo-cd.readthedocs.io/en/stable/user-guide/helm/
- Argo CD sync phases and waves: https://argo-cd.readthedocs.io/en/latest/user-guide/sync-waves/
- Argo CD automated sync policy: https://argo-cd.readthedocs.io/en/release-2.8/user-guide/auto_sync/
- Kubernetes Kustomize overview: https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization
