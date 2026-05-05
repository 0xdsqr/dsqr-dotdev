const tags = {
  location: {
    homelab: "tag:homelab",
    proxmox: "tag:proxmox",
    cloud: "tag:cloud",
    hetzner: "tag:hetzner",
    aws: "tag:aws",
  },
  role: {
    server: "tag:server",
    workstation: "tag:workstation",
    infra: "tag:infra",
    mail: "tag:mail",
    backup: "tag:backup",
    exitNode: "tag:exit-node",
  },
} as const

type PolicyArgs = {
  adminUser: string
  openTaggedServerAccess?: boolean | undefined
}

function tagOwners(adminUser: string) {
  return {
    [tags.location.homelab]: [adminUser],
    [tags.location.proxmox]: [adminUser],
    [tags.location.cloud]: [adminUser],
    [tags.location.hetzner]: [adminUser],
    [tags.location.aws]: [adminUser],
    [tags.role.server]: [adminUser],
    [tags.role.workstation]: [adminUser],
    [tags.role.infra]: [adminUser],
    [tags.role.mail]: [adminUser],
    [tags.role.backup]: [adminUser],
    [tags.role.exitNode]: [adminUser],
  } as const
}

function createPolicy(args: PolicyArgs) {
  const grants = [
    {
      src: [args.adminUser],
      dst: ["*"],
      ip: ["*"],
    },
    ...((args.openTaggedServerAccess ?? true)
      ? [
          {
            src: [tags.role.workstation],
            dst: ["*"],
            ip: ["*"],
          },
          {
            src: [tags.role.server],
            dst: [tags.role.server],
            ip: ["*"],
          },
        ]
      : [
          {
            src: [tags.role.workstation],
            dst: ["*"],
            ip: ["*"],
          },
          {
            src: [tags.location.homelab],
            dst: [tags.role.backup],
            ip: ["*"],
          },
          {
            src: [tags.role.mail],
            dst: [tags.role.backup],
            ip: ["*"],
          },
          {
            src: [args.adminUser],
            dst: [tags.role.mail],
            ip: ["22", "80", "443", "993", "4190"],
          },
        ]),
  ] as const

  return {
    tagOwners: tagOwners(args.adminUser),
    grants,
    autoApprovers: {
      exitNode: [tags.role.exitNode],
    },
  } as const
}

export const tailscale = {
  tags,
  keyProfiles: {
    proxmoxControlPlane: {
      description: "proxmox control plane auth key",
      tags: [tags.location.homelab, tags.location.proxmox, tags.role.infra],
    },
    homelabServer: {
      description: "homelab server auth key",
      tags: [tags.location.homelab, tags.role.server],
    },
    darwinWorkstation: {
      description: "darwin workstation auth key",
      tags: [tags.location.homelab, tags.role.workstation],
    },
    homelabBackup: {
      description: "homelab backup auth key",
      tags: [tags.location.homelab, tags.role.backup],
    },
    opnsenseExitNode: {
      description: "opnsense exit node auth key",
      tags: [tags.location.homelab, tags.role.infra, tags.role.exitNode],
    },
    hetznerMail: {
      description: "hetzner mail auth key",
      tags: [tags.location.cloud, tags.location.hetzner, tags.role.mail],
    },
    awsServer: {
      description: "aws server auth key",
      tags: [tags.location.cloud, tags.location.aws, tags.role.server],
    },
  },
  createPolicy,
} as const
