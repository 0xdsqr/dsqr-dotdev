# GitOps

This directory is the desired-state layer Argo CD will reconcile after Pulumi bootstraps the `argocd` namespace and Argo CD Helm release.

Current split:

- Pulumi/Haven bootstraps cluster platform dependencies and installs Argo CD.
- Argo CD reads this directory and manages platform add-ons plus dsqr.dev application deployments.
- Helm remains the package format for apps.
- Kustomize composes the cluster/environment manifests that define Argo CD projects and application generation.
- Cloudflare publishes `argocd.dsqr.dev` through the tunnel and protects it with Cloudflare Access before traffic reaches Argo CD.

The first migration slice intentionally does not auto-sync generated applications. That lets the existing Pulumi-owned Helm releases remain live until we cut over deliberately.

Ownership split:

- `platform` project: cluster add-ons such as Cilium, MetalLB, Traefik, and observability exporters/monitors.
- `dsqr` project: app workloads in `dsqr` and `twt`.
- Argo CD itself is still bootstrapped by Pulumi; self-management can come after the first safe sync.

Render locally:

```sh
kubectl kustomize gitops/bootstrap
kubectl kustomize gitops/clusters/homelab
```

Bootstrap after Argo CD is installed:

```sh
kubectl apply -k gitops/bootstrap
```

Cutover plan:

1. Preview and install Argo CD with `npm run infra:k8s:preview` and `npm run infra:k8s:up`.
2. Preview and apply the Cloudflare stack with `CLOUDFLARE_ACCESS_ADMIN_EMAILS` set to the email addresses allowed through Access.
3. Apply `gitops/bootstrap` so Argo CD sees the `homelab` root application.
4. Disable or remove the matching Pulumi-owned app Helm releases.
5. Manually sync the generated Argo CD applications once each diff is understood.
6. Enable automated sync with prune/self-heal after Argo owns the app resources cleanly.
