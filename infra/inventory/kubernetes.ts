import {
  decodeHelmReleaseInventory,
  decodeMetalLbAddressPoolInventory,
  decodeMetalLbL2AdvertisementInventory,
  decodeNamespaceInventory,
  type HelmReleaseInventory,
  type MetalLbAddressPoolInventory,
  type MetalLbL2AdvertisementInventory,
  type NamespaceInventory,
} from "../../packages/infra-model/src/index.ts"

const namespaces = {
  argocd: {
    name: "argocd",
    labels: {
      "homelab.dev/owner": "platform",
      "homelab.dev/tier": "gitops",
      "pod-security.kubernetes.io/enforce": "baseline",
    },
  },
} satisfies NamespaceInventory

const helmReleases = {
  cilium: {
    releaseName: "cilium",
    namespace: "kube-system",
    chart: "cilium",
    enabled: false,
    repository: "https://helm.cilium.io/",
    version: "1.19.1",
    valueYamlFiles: [
      "../../gitops/manifests/cilium/base/values-common.yaml",
      "../../gitops/manifests/cilium/overlays/homelab/values-overrides.yaml",
    ],
  },
  metallb: {
    releaseName: "metallb",
    namespace: "metallb-system",
    chart: "metallb",
    enabled: false,
    repository: "https://metallb.github.io/metallb",
    version: "0.15.3",
    valueYamlFiles: [
      "../../gitops/manifests/metallb/base/values-common.yaml",
      "../../gitops/manifests/metallb/overlays/homelab/values-overrides.yaml",
    ],
    dependsOn: ["cilium"],
  },
  traefik: {
    releaseName: "traefik",
    namespace: "traefik",
    chart: "traefik",
    enabled: false,
    repository: "https://traefik.github.io/charts",
    version: "39.0.7",
    valueYamlFiles: [
      "../../gitops/manifests/traefik/base/values-common.yaml",
      "../../gitops/manifests/traefik/overlays/homelab/values-overrides.yaml",
    ],
    dependsOn: ["cilium"],
  },
  kubeStateMetrics: {
    releaseName: "kube-state-metrics",
    namespace: "kube-system",
    chart: "kube-state-metrics",
    enabled: false,
    repository: "https://prometheus-community.github.io/helm-charts",
    version: "7.2.2",
    valueYamlFiles: [
      "../../gitops/manifests/kube-state-metrics/base/values-common.yaml",
      "../../gitops/manifests/kube-state-metrics/overlays/homelab/values-overrides.yaml",
    ],
    dependsOn: ["cilium"],
  },
  k8sMonitoring: {
    releaseName: "k8s-monitoring",
    namespace: "observability",
    chart: "k8s-monitoring",
    enabled: false,
    repository: "https://grafana.github.io/helm-charts",
    version: "3.5.3",
    valueYamlFiles: [
      "../../gitops/manifests/k8s-monitoring/base/values-common.yaml",
      "../../gitops/manifests/k8s-monitoring/overlays/homelab/values-overrides.yaml",
    ],
    dependsOn: ["cilium", "kubeStateMetrics"],
  },
  argoCd: {
    releaseName: "argocd",
    namespace: "argocd",
    chart: "argo-cd",
    repository: "https://argoproj.github.io/argo-helm",
    version: "9.5.2",
    valueYamlFiles: [
      "../../gitops/manifests/argocd/base/values-common.yaml",
      "../../gitops/manifests/argocd/overlays/homelab/values-overrides.yaml",
    ],
  },
  dotdevWeb: {
    releaseName: "dotdev-web",
    namespace: "dsqr",
    chart: "../../helm/dotdev-web",
    enabled: false,
    valueYamlFiles: [
      "../../gitops/manifests/dotdev-web/base/values-common.yaml",
      "../../gitops/manifests/dotdev-web/overlays/homelab/values-overrides.yaml",
    ],
    dependsOn: ["traefik"],
  },
  dotdevStudio: {
    releaseName: "dotdev-studio",
    namespace: "dsqr",
    chart: "../../helm/dotdev-studio",
    enabled: false,
    valueYamlFiles: [
      "../../gitops/manifests/dotdev-studio/base/values-common.yaml",
      "../../gitops/manifests/dotdev-studio/overlays/homelab/values-overrides.yaml",
    ],
    dependsOn: ["traefik"],
  },
  dotdevLabs: {
    releaseName: "dotdev-labs",
    namespace: "dsqr",
    chart: "../../helm/dotdev-labs",
    enabled: false,
    valueYamlFiles: [
      "../../gitops/manifests/dotdev-labs/base/values-common.yaml",
      "../../gitops/manifests/dotdev-labs/overlays/homelab/values-overrides.yaml",
    ],
    dependsOn: ["traefik"],
  },
} satisfies HelmReleaseInventory

const metallbAddressPools = {} satisfies MetalLbAddressPoolInventory

const metallbL2Advertisements = {} satisfies MetalLbL2AdvertisementInventory

export const kubernetes = {
  namespaces: decodeNamespaceInventory(namespaces),
  helmReleases: decodeHelmReleaseInventory(helmReleases),
  metallb: {
    addressPools: decodeMetalLbAddressPoolInventory(metallbAddressPools),
    l2Advertisements: decodeMetalLbL2AdvertisementInventory(metallbL2Advertisements),
  },
} as const
