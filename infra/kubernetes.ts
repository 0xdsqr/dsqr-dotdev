import { fileURLToPath } from "node:url"
import * as path from "node:path"

import { createKubernetesPlatform } from "../packages/effect-pulumi/kubernetes/src/index.ts"
import { haven } from "../haven.config.ts"

const stackRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "kubernetes")

export const platform = createKubernetesPlatform({
  stackRoot,
  namespaces: haven.kubernetes.namespaces,
  helmReleases: haven.kubernetes.helmReleases,
  metallbAddressPools: haven.kubernetes.metallb.addressPools,
  metallbL2Advertisements: haven.kubernetes.metallb.l2Advertisements,
})
