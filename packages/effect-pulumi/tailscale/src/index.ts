import * as pulumi from "@pulumi/pulumi"
import * as tailscale from "@pulumi/tailscale"

export type TailscaleKeyProfile = {
  readonly description: string
  readonly tags: ReadonlyArray<string>
}

export type TailscalePlatformArgs = {
  policyDocument: unknown
  keyProfiles: {
    readonly proxmoxControlPlane: TailscaleKeyProfile
    readonly homelabServer: TailscaleKeyProfile
    readonly homelabBackup: TailscaleKeyProfile
    readonly opnsenseExitNode: TailscaleKeyProfile
    readonly hetznerMail: TailscaleKeyProfile
    readonly awsServer: TailscaleKeyProfile
  }
}

export const hardenedTailnetKeyDefaults = {
  reusable: false,
  ephemeral: false,
  preauthorized: false,
  expiry: 60 * 60,
  recreateIfInvalid: "never",
} as const

export const tailnetPolicySafetyDefaults = {
  overwriteExistingContent: false,
  resetAclOnDestroy: false,
} as const

function createTailnetKey(name: string, profile: TailscaleKeyProfile, policy: tailscale.Acl) {
  return new tailscale.TailnetKey(
    name,
    {
      description: profile.description,
      ...hardenedTailnetKeyDefaults,
      tags: [...profile.tags],
    },
    { dependsOn: [policy] },
  )
}

export function createTailscalePlatform(args: TailscalePlatformArgs) {
  const policy = new tailscale.Acl("tailnet-policy", {
    acl: JSON.stringify(args.policyDocument, null, 2),
    ...tailnetPolicySafetyDefaults,
  })

  const proxmoxControlPlaneKey = createTailnetKey(
    "proxmox-control-plane-key",
    args.keyProfiles.proxmoxControlPlane,
    policy,
  )
  const homelabServerKey = createTailnetKey(
    "homelab-server-key",
    args.keyProfiles.homelabServer,
    policy,
  )
  const homelabBackupKey = createTailnetKey(
    "homelab-backup-key",
    args.keyProfiles.homelabBackup,
    policy,
  )
  const opnsenseExitNodeKey = createTailnetKey(
    "opnsense-exit-node-key",
    args.keyProfiles.opnsenseExitNode,
    policy,
  )
  const hetznerMailKey = createTailnetKey("hetzner-mail-key", args.keyProfiles.hetznerMail, policy)
  const awsServerKey = createTailnetKey("aws-server-key", args.keyProfiles.awsServer, policy)

  return {
    policy: policy.acl,
    authKeys: {
      proxmoxControlPlane: pulumi.secret(proxmoxControlPlaneKey.key),
      homelabServer: pulumi.secret(homelabServerKey.key),
      homelabBackup: pulumi.secret(homelabBackupKey.key),
      opnsenseExitNode: pulumi.secret(opnsenseExitNodeKey.key),
      hetznerMail: pulumi.secret(hetznerMailKey.key),
      awsServer: pulumi.secret(awsServerKey.key),
    },
  }
}
