import * as pulumi from "@pulumi/pulumi"
import * as k8s from "@pulumi/kubernetes"
import * as path from "node:path"

type NamespaceInventoryLike = Readonly<
  Record<
    string,
    {
      name: string
      labels?: Readonly<Record<string, string>> | undefined
      annotations?: Readonly<Record<string, string>> | undefined
    }
  >
>

type HelmReleaseInventoryLike = Readonly<
  Record<
    string,
    {
      releaseName: string
      namespace: string
      chart: string
      enabled?: boolean | undefined
      repository?: string | undefined
      version?: string | undefined
      values?: Readonly<Record<string, unknown>> | undefined
      valueYamlFiles?: ReadonlyArray<string> | undefined
      dependsOn?: ReadonlyArray<string> | undefined
    }
  >
>

type MetalLbAddressPoolInventoryLike = Readonly<
  Record<
    string,
    {
      name: string
      namespace: string
      addresses: ReadonlyArray<string>
      autoAssign?: boolean | undefined
      avoidBuggyIPs?: boolean | undefined
    }
  >
>

type MetalLbL2AdvertisementInventoryLike = Readonly<
  Record<
    string,
    {
      name: string
      namespace: string
      ipAddressPools: ReadonlyArray<string>
    }
  >
>

export type KubernetesPlatformArgs = {
  stackRoot: string
  namespaces: NamespaceInventoryLike
  helmReleases: HelmReleaseInventoryLike
  metallbAddressPools: MetalLbAddressPoolInventoryLike
  metallbL2Advertisements: MetalLbL2AdvertisementInventoryLike
}

function namespaceMetadata(spec: {
  name: string
  labels?: Readonly<Record<string, string>> | undefined
  annotations?: Readonly<Record<string, string>> | undefined
}) {
  return {
    name: spec.name,
    ...(spec.labels ? { labels: spec.labels } : undefined),
    ...(spec.annotations ? { annotations: spec.annotations } : undefined),
  }
}

function resolveChartReference(
  stackRoot: string,
  spec: {
    chart: string
    repository?: string | undefined
  },
) {
  return spec.repository ? spec.chart : path.resolve(stackRoot, spec.chart)
}

function resolveValueYamlFiles(stackRoot: string, valueYamlFiles: ReadonlyArray<string>) {
  return valueYamlFiles.map(
    (valuePath) => new pulumi.asset.FileAsset(path.resolve(stackRoot, valuePath)),
  )
}

export function createKubernetesPlatform(args: KubernetesPlatformArgs) {
  const namespaceEntries = Object.entries(args.namespaces)

  const namespaceResources = Object.fromEntries(
    namespaceEntries.map(([key, spec]) => {
      return [
        key,
        new k8s.core.v1.Namespace(key, {
          metadata: namespaceMetadata(spec),
        }),
      ]
    }),
  )

  const kubernetesNamespaces = Object.fromEntries(
    Object.entries(namespaceResources).map(([key, resource]) => [key, resource.metadata.name]),
  )

  const namespaceResourcesByName = Object.fromEntries(
    namespaceEntries.map(([key, spec]) => [spec.name, namespaceResources[key]]),
  )

  const releases: Record<string, k8s.helm.v3.Release> = {}

  for (const [key, spec] of Object.entries(args.helmReleases)) {
    if (spec.enabled === false) {
      continue
    }

    const releaseDependsOn: pulumi.Input<pulumi.Resource>[] = []
    const namespaceResource = namespaceResourcesByName[spec.namespace]

    if (namespaceResource) {
      releaseDependsOn.push(namespaceResource)
    }

    for (const dependencyKey of spec.dependsOn ?? []) {
      const dependency = releases[dependencyKey]

      if (!dependency) {
        throw new Error(`Helm release ${key} depends on unknown release ${dependencyKey}`)
      }

      releaseDependsOn.push(dependency)
    }

    const releaseArgs: k8s.helm.v3.ReleaseArgs = {
      name: spec.releaseName,
      namespace: spec.namespace,
      chart: resolveChartReference(args.stackRoot, spec),
      createNamespace: false,
      skipAwait: false,
      atomic: true,
      cleanupOnFail: true,
    }

    if (spec.repository) {
      releaseArgs.repositoryOpts = {
        repo: spec.repository,
      }
    }

    if (spec.version) {
      releaseArgs.version = spec.version
    }

    if (spec.values) {
      releaseArgs.values = spec.values
    }

    if (spec.valueYamlFiles) {
      releaseArgs.valueYamlFiles = resolveValueYamlFiles(args.stackRoot, spec.valueYamlFiles)
    }

    releases[key] = new k8s.helm.v3.Release(
      key,
      releaseArgs,
      releaseDependsOn.length > 0 ? { dependsOn: releaseDependsOn } : undefined,
    )
  }

  const metallbRelease = releases.metallb

  if (!metallbRelease) {
    throw new Error("MetalLB release inventory entry is required")
  }

  const metallbPools = Object.fromEntries(
    Object.entries(args.metallbAddressPools).map(([key, spec]) => {
      const pool = new k8s.apiextensions.CustomResource(
        `metallb-ipaddresspool-${key}`,
        {
          apiVersion: "metallb.io/v1beta1",
          kind: "IPAddressPool",
          metadata: {
            name: spec.name,
            namespace: spec.namespace,
          },
          spec: {
            addresses: spec.addresses,
            autoAssign: spec.autoAssign,
            avoidBuggyIPs: spec.avoidBuggyIPs,
          },
        },
        {
          dependsOn: [metallbRelease],
        },
      )

      return [key, pool]
    }),
  )

  const metallbAdvertisements = Object.fromEntries(
    Object.entries(args.metallbL2Advertisements).map(([key, spec]) => {
      const metallbPool = metallbPools[key]

      if (!metallbPool) {
        throw new Error(`Missing MetalLB pool for advertisement ${key}`)
      }

      const advertisement = new k8s.apiextensions.CustomResource(
        `metallb-l2advertisement-${key}`,
        {
          apiVersion: "metallb.io/v1beta1",
          kind: "L2Advertisement",
          metadata: {
            name: spec.name,
            namespace: spec.namespace,
          },
          spec: {
            ipAddressPools: spec.ipAddressPools,
          },
        },
        {
          dependsOn: [metallbRelease, metallbPool],
        },
      )

      return [key, advertisement]
    }),
  )

  return {
    namespaces: kubernetesNamespaces,
    releases: Object.fromEntries(
      Object.entries(releases).map(([key, release]) => [key, release.status.namespace]),
    ),
    metallb: {
      addressPools: Object.fromEntries(
        Object.entries(metallbPools).map(([key, resource]) => [key, resource.metadata.name]),
      ),
      l2Advertisements: Object.fromEntries(
        Object.entries(metallbAdvertisements).map(([key, resource]) => [
          key,
          resource.metadata.name,
        ]),
      ),
    },
  }
}
