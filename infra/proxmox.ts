import {
  createProxmoxPlatform,
  loadProxmoxConnectionConfig,
} from "../packages/effect-pulumi/proxmox/src/index.ts"
import { haven } from "../haven.config.ts"

const connection = loadProxmoxConnectionConfig()

export const proxmox = createProxmoxPlatform({
  connection,
  defaults: haven.proxmox.defaults,
  inventory: haven.proxmox.vms,
})
