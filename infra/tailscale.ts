import { createTailscalePlatform } from "../packages/effect-pulumi/tailscale/src/index.ts"
import { haven } from "../haven.config.ts"
import { tailscaleConfig } from "./config.ts"

const tailscale = createTailscalePlatform({
  policyDocument: haven.tailscale.createPolicy({
    adminUser: tailscaleConfig.adminUser,
    openTaggedServerAccess: tailscaleConfig.openTaggedServerAccess,
  }),
  keyProfiles: haven.tailscale.keyProfiles,
})

export const tailscalePolicy = tailscale.policy
export const proxmoxControlPlaneAuthKey = tailscale.authKeys.proxmoxControlPlane
export const homelabServerAuthKey = tailscale.authKeys.homelabServer
export const darwinWorkstationAuthKey = tailscale.authKeys.darwinWorkstation
export const homelabBackupAuthKey = tailscale.authKeys.homelabBackup
export const opnsenseExitNodeAuthKey = tailscale.authKeys.opnsenseExitNode
export const hetznerMailAuthKey = tailscale.authKeys.hetznerMail
export const awsServerAuthKey = tailscale.authKeys.awsServer
