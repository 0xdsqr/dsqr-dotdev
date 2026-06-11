import { fileURLToPath } from "node:url"
import * as path from "node:path"

import { $definition, Effect } from "./packages/infra-model/src/index.ts"
import { cloudflare } from "./infra/inventory/cloudflare.ts"
import { kubernetes } from "./infra/inventory/kubernetes.ts"
import { proxmox } from "./infra/inventory/proxmox.ts"
import { tailscale } from "./infra/inventory/tailscale.ts"
import { vault } from "./infra/inventory/vault.ts"
import { $stacks } from "./packages/haven/src/index.ts"

const inventory = {
  proxmox,
  kubernetes,
  cloudflare,
  tailscale,
  vault,
  infra: $stacks({
    rootDirectory: path.dirname(fileURLToPath(import.meta.url)),
    directory: "infra",
    projects: {
      proxmox: {
        projectName: "pulumi",
        description: "Minimal Proxmox VE Pulumi project",
      },
      tailscale: {
        projectName: "tailscale-control",
        description: "Homelab Tailscale policy and auth key stack",
      },
      hetzner: {
        projectName: "hetzner-mail",
        description: "Hetzner Cloud mail server bootstrap stack",
      },
      cloudflare: {
        projectName: "cloudflare-edge",
        description: "Homelab Cloudflare tunnel and DNS stack",
      },
      kubernetes: {
        description: "Homelab Kubernetes platform stack",
      },
      vault: {
        projectName: "vault-homelab",
        description: "Homelab Vault mounts, policies, and Kubernetes auth",
      },
    },
    groups: {
      default: ["proxmox", "tailscale", "hetzner", "cloudflare"],
      k8: ["kubernetes"],
      security: ["vault"],
      all: ["proxmox", "tailscale", "hetzner", "cloudflare", "kubernetes", "vault"],
    },
  }),
} as const

const definition = $definition<
  {
    readonly name: "haven"
    readonly stage: string
  },
  typeof inventory,
  {
    readonly app: {
      readonly name: "haven"
      readonly stage: string
    }
    readonly runs: typeof inventory.infra.groups
    readonly stacks: readonly string[]
  }
>({
  app(input) {
    return {
      name: "haven",
      stage: input.stage ?? "dev",
    }
  },
  run() {
    return Effect.succeed(inventory)
  },
  outputs(input, state) {
    return Effect.succeed({
      app: {
        name: "haven",
        stage: input.stage ?? "dev",
      },
      runs: state.infra.groups,
      stacks: Object.keys(state.infra.stacks),
    })
  },
})

export const haven = definition.run({ stage: "dev" })
export const havenEffect = definition.runEffect({ stage: "dev" })
export const infra = haven.infra
export const homelab = haven
export const homelabEffect = havenEffect
export default definition
