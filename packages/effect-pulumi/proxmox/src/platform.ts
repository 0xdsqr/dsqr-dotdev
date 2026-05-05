import type { VmDefaults, VmInventory } from "@dsqr-dotdev/infra-model"

import type { ProxmoxConnectionConfig } from "./config.ts"
import { createProxmoxProvider } from "./provider.ts"
import { createProxmoxVm, describeVm, type ProxmoxVmTransforms } from "./vm.ts"

export type ProxmoxPlatformArgs = {
  connection: ProxmoxConnectionConfig
  defaults: VmDefaults
  inventory: VmInventory
  providerName?: string
  transform?: ProxmoxVmTransforms
}

export function createProxmoxPlatform(args: ProxmoxPlatformArgs) {
  const provider = createProxmoxProvider(args.providerName ?? "proxmoxve", args.connection)

  const vms = Object.fromEntries(
    Object.entries(args.inventory).map(([key, spec]) => {
      const vm = createProxmoxVm({
        spec,
        provider,
        defaults: args.defaults,
        ...(args.transform ? { transform: args.transform } : {}),
      })

      return [key, describeVm(vm)]
    }),
  )

  return {
    provider: {
      endpoint: args.connection.endpoint,
      insecure: args.connection.insecure,
    },
    vms,
  }
}
