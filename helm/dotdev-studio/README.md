# dotdev-studio Helm Chart

This chart deploys the `studio` app from `dsqr-dotdev` to Kubernetes.

## Prerequisites

- A namespace such as `dsqr`
- An existing app secret, for example `dotdev-studio-secrets`
- An existing GHCR image pull secret, for example `ghcr-creds`

## Local Install

```bash
helm upgrade --install dotdev-studio ./helm/dotdev-studio \
  --namespace dsqr \
  --create-namespace \
  -f ./helm/dotdev-studio/values-prod.yaml
```

## Deploy A Specific Image Tag

```bash
helm upgrade --install dotdev-studio ./helm/dotdev-studio \
  --namespace dsqr \
  --create-namespace \
  -f ./helm/dotdev-studio/values-prod.yaml \
  --set image.tag=sha-<commit-sha>
```

## Install From GHCR OCI

```bash
helm registry login ghcr.io -u YOUR_GITHUB_USERNAME

helm upgrade --install dotdev-studio oci://ghcr.io/0xdsqr/charts/dotdev-studio \
  --version <published-chart-version> \
  --namespace dsqr \
  --create-namespace \
  -f ./values-prod.yaml
```
