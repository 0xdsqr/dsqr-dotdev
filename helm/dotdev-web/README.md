# dotdev-web Helm Chart

This chart deploys the `dotdev` app from `dsqr-dotdev` to Kubernetes.

## Prerequisites

- A namespace such as `dsqr`
- An existing app secret, for example `dotdev-web-secrets`
- An existing GHCR image pull secret, for example `ghcr-creds`

## Local Install

```bash
helm upgrade --install dotdev-web ./helm/dotdev-web \
  --namespace dsqr \
  --create-namespace \
  -f ./helm/dotdev-web/values-prod.yaml
```

## Deploy A Specific Image Tag

```bash
helm upgrade --install dotdev-web ./helm/dotdev-web \
  --namespace dsqr \
  --create-namespace \
  -f ./helm/dotdev-web/values-prod.yaml \
  --set image.tag=sha-<commit-sha>
```

## Install From GHCR OCI

```bash
helm registry login ghcr.io -u YOUR_GITHUB_USERNAME

helm upgrade --install dotdev-web oci://ghcr.io/0xdsqr/charts/dotdev-web \
  --version <published-chart-version> \
  --namespace dsqr \
  --create-namespace \
  -f ./values-prod.yaml
```
