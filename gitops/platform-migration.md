# Kubernetes Platform Ownership

This is the post-migration runbook for Kubernetes ownership in the homelab cluster.

## Final State

Pulumi/Haven is now the bootstrap layer. Argo CD owns Kubernetes day-2 desired state.

| Surface | Owner | Notes |
| --- | --- | --- |
| `argocd` namespace | Pulumi/Haven | Bootstrap root of trust. |
| `argocd` Helm release | Pulumi/Haven | Leave here unless deliberately moving Argo to self-management. |
| `homelab` root Application | Argo CD | App-of-apps entrypoint for cluster GitOps. |
| `cilium` | Argo CD | Manual sync. This is the CNI and kube-proxy replacement. |
| `metallb` | Argo CD | Manual sync. |
| `metallb-config` | Argo CD | Owns `IPAddressPool/ingress` and `L2Advertisement/ingress`. |
| `traefik` | Argo CD | Manual or carefully reviewed sync. |
| `metrics-server` | Argo CD | Provides `metrics.k8s.io` for `kubectl top` and HPA resource metrics. |
| `kube-state-metrics` | Argo CD | Observability exporter. |
| `k8s-monitoring` | Argo CD | Grafana Alloy monitoring stack. |
| Product apps | Argo CD | `dotdev-*`, `fidara`, and `twt-*`. |
| App namespaces | Argo CD Applications | Declared with `CreateNamespace=true` and `managedNamespaceMetadata`. |

Expected Pulumi preview after migration:

```sh
npm run infra:k8s:preview
```

```text
Resources:
    3 unchanged
```

Those remaining resources are the intentional Argo CD bootstrap layer.

## Operating Rules

- Do not re-enable Pulumi ownership for moved Kubernetes add-ons unless rolling back a specific incident.
- Do not run `pulumi up` to delete live Kubernetes platform resources. Handoffs use `pulumi state delete`, not deletion.
- Keep `argocd` in Pulumi unless there is a specific reason to make Argo self-manage itself.
- Keep `cilium`, `metallb`, and `traefik` manual-sync unless repeated clean diffs prove automation is boring.
- Do not set `CreateNamespace=true` for apps that target core namespaces such as `kube-system` or `argocd`.
- Put raw cluster resources in Kustomize manifests, not hidden inside Helm values.
- Runtime secret values are not committed. Create them with `kubectl` or the relevant secret controller.

## Fresh Cluster Bootstrap

Normal Argo CD pods need cluster networking. On a brand new cluster, seed Cilium before relying on Argo CD.

One-time Cilium seed, using the same chart and values GitOps uses:

```sh
cd ~/dsqr-dotdev
helm repo add cilium https://helm.cilium.io/
helm repo update
helm upgrade --install cilium cilium/cilium \
  --namespace kube-system \
  --version 1.19.1 \
  -f gitops/manifests/cilium/base/values-common.yaml \
  -f gitops/manifests/cilium/overlays/homelab/values-overrides.yaml
kubectl -n kube-system rollout status ds/cilium --timeout=10m
kubectl -n kube-system rollout status deploy/cilium-operator --timeout=10m
```

Then bootstrap Argo CD with Pulumi/Haven:

```sh
cd ~/dsqr-dotdev
npm run infra:k8s:preview
npm run infra:k8s:up
kubectl apply -k gitops/clusters/homelab/bootstrap
```

After the root app appears, sync Argo-owned platform apps from Argo CD. The Cilium Application should adopt the seeded release rather than reinstalling a different configuration.

## Daily Checks

Global health:

```sh
kubectl -n argocd get application
npm run infra:k8s:preview
kubectl get nodes
```

Cilium:

```sh
kubectl -n argocd get application cilium
kubectl -n kube-system rollout status ds/cilium --timeout=10m
kubectl -n kube-system rollout status deploy/cilium-operator --timeout=10m
```

Ingress and load balancer path:

```sh
kubectl -n traefik get deploy,svc,pod
kubectl -n metallb-system get deploy,daemonset,svc,pod
kubectl -n metallb-system get ipaddresspool,l2advertisement
```

Metrics and observability:

```sh
kubectl top nodes
kubectl top pods -A
kubectl -n observability get deploy,daemonset,statefulset,svc,pod
```

## Sync Commands

Refresh and sync one app without broad pruning:

```sh
kubectl -n argocd annotate application <app-name> argocd.argoproj.io/refresh=hard --overwrite
kubectl -n argocd patch application <app-name> --type merge -p '{"operation":{"sync":{"syncOptions":["ApplyOutOfSyncOnly=true"]}}}'
kubectl -n argocd get application <app-name> -w
```

Root app sync:

```sh
kubectl -n argocd annotate application homelab argocd.argoproj.io/refresh=hard --overwrite
kubectl -n argocd patch application homelab --type merge -p '{"operation":{"sync":{"prune":true,"syncOptions":["ApplyOutOfSyncOnly=true","PruneLast=true"]}}}'
kubectl -n argocd get application homelab -w
```

## Optional Argo CD Self-Management

Argo CD has a self-management Application in Git, but Pulumi still owns the live Argo CD release.

Recommendation: leave it this way. It gives the cluster a simple recovery chain:

1. Seed Cilium.
2. Pulumi installs or repairs Argo CD.
3. Argo CD reconciles everything else.

If moving Argo CD to self-management later, do it as its own maintenance task:

1. Sync the `argocd` Application and verify all Argo pods stay healthy.
2. Remove the Pulumi `argoCd` release from state without deleting live resources.
3. Remove the `argocd` namespace and `argoCd` release from Pulumi inventory.
4. Run `npm run infra:k8s:preview` and confirm Pulumi has no Kubernetes resources left to delete.

## Rollback Shape

Prefer fixing forward if live Cilium, Traefik, or MetalLB resources are still running.

To intentionally return a component to Pulumi ownership:

1. Pause or avoid syncing the matching Argo app.
2. Re-enable only that component in `infra/inventory/kubernetes.ts`.
3. Run `npm run infra:k8s:preview`.
4. Run `npm run infra:k8s:up` only if the preview recreates the expected Pulumi state without deleting unrelated resources.

