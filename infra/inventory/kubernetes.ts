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
  dsqr: {
    name: "dsqr",
    labels: {
      "homelab.dev/owner": "dsqr",
      "homelab.dev/tier": "apps",
      "pod-security.kubernetes.io/enforce": "baseline",
    },
  },
  twt: {
    name: "twt",
    labels: {
      "homelab.dev/owner": "dsqr",
      "homelab.dev/tier": "apps",
      "pod-security.kubernetes.io/enforce": "baseline",
    },
  },
  metallbSystem: {
    name: "metallb-system",
    labels: {
      "homelab.dev/owner": "platform",
      "homelab.dev/tier": "platform",
    },
  },
  traefik: {
    name: "traefik",
    labels: {
      "homelab.dev/owner": "platform",
      "homelab.dev/tier": "platform",
    },
  },
  observability: {
    name: "observability",
    labels: {
      "homelab.dev/owner": "platform",
      "homelab.dev/tier": "platform",
    },
  },
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
    repository: "https://helm.cilium.io/",
    version: "1.19.1",
    valueYamlFiles: ["../inventory/values/kubernetes/cilium.yaml"],
  },
  metallb: {
    releaseName: "metallb",
    namespace: "metallb-system",
    chart: "metallb",
    repository: "https://metallb.github.io/metallb",
    version: "0.15.3",
    valueYamlFiles: ["../inventory/values/kubernetes/metallb.yaml"],
    dependsOn: ["cilium"],
  },
  traefik: {
    releaseName: "traefik",
    namespace: "traefik",
    chart: "traefik",
    repository: "https://traefik.github.io/charts",
    version: "39.0.7",
    valueYamlFiles: ["../inventory/values/kubernetes/traefik.yaml"],
    dependsOn: ["cilium"],
  },
  kubeStateMetrics: {
    releaseName: "kube-state-metrics",
    namespace: "kube-system",
    chart: "kube-state-metrics",
    repository: "https://prometheus-community.github.io/helm-charts",
    version: "7.2.2",
    valueYamlFiles: ["../inventory/values/kubernetes/kube-state-metrics.yaml"],
    dependsOn: ["cilium"],
  },
  k8sMonitoring: {
    releaseName: "k8s-monitoring",
    namespace: "observability",
    chart: "k8s-monitoring",
    repository: "https://grafana.github.io/helm-charts",
    version: "3.5.3",
    valueYamlFiles: ["../inventory/values/kubernetes/k8s-monitoring.yaml"],
    dependsOn: ["cilium", "kubeStateMetrics"],
  },
  argoCd: {
    releaseName: "argocd",
    namespace: "argocd",
    chart: "argo-cd",
    repository: "https://argoproj.github.io/argo-helm",
    version: "9.5.2",
    valueYamlFiles: ["../inventory/values/kubernetes/argocd.yaml"],
    dependsOn: ["cilium"],
  },
  dotdevWeb: {
    releaseName: "dotdev-web",
    namespace: "dsqr",
    chart: "../../helm/dotdev-web",
    enabled: false,
    valueYamlFiles: ["../../helm/dotdev-web/values-prod.yaml"],
    dependsOn: ["traefik"],
  },
  dotdevStudio: {
    releaseName: "dotdev-studio",
    namespace: "dsqr",
    chart: "../../helm/dotdev-studio",
    enabled: false,
    valueYamlFiles: ["../../helm/dotdev-studio/values-prod.yaml"],
    dependsOn: ["traefik"],
  },
  dotdevLabs: {
    releaseName: "dotdev-labs",
    namespace: "dsqr",
    chart: "../../helm/dotdev-labs",
    enabled: false,
    valueYamlFiles: ["../../helm/dotdev-labs/values-prod.yaml"],
    dependsOn: ["traefik"],
  },
  twtWeb: {
    releaseName: "twt-web",
    namespace: "twt",
    chart: "../../helm/tastingswithtay-web",
    enabled: false,
    valueYamlFiles: ["../../helm/tastingswithtay-web/values-prod.yaml"],
    dependsOn: ["traefik"],
  },
  twtAdmin: {
    releaseName: "twt-admin",
    namespace: "twt",
    chart: "../../helm/tastingswithtay-admin",
    enabled: false,
    valueYamlFiles: ["../../helm/tastingswithtay-admin/values-prod.yaml"],
    dependsOn: ["traefik"],
  },
} satisfies HelmReleaseInventory

const metallbAddressPools = {
  ingress: {
    name: "ingress",
    namespace: "metallb-system",
    addresses: ["10.10.30.200-10.10.30.249"],
    autoAssign: true,
    avoidBuggyIPs: true,
  },
} satisfies MetalLbAddressPoolInventory

const metallbL2Advertisements = {
  ingress: {
    name: "ingress",
    namespace: "metallb-system",
    ipAddressPools: ["ingress"],
  },
} satisfies MetalLbL2AdvertisementInventory

export const kubernetes = {
  namespaces: decodeNamespaceInventory(namespaces),
  helmReleases: decodeHelmReleaseInventory(helmReleases),
  metallb: {
    addressPools: decodeMetalLbAddressPoolInventory(metallbAddressPools),
    l2Advertisements: decodeMetalLbL2AdvertisementInventory(metallbL2Advertisements),
  },
} as const
