import * as hcloud from "@pulumi/hcloud"
import type * as pulumi from "@pulumi/pulumi"
import {
  Effect,
  PulumiResourceConfigError,
  requireResourceConfigEffect,
  runSyncOrThrow,
} from "@dsqr-dotdev/effect-pulumi-core"

export interface HetznerMailServerConfig {
  readonly name?: string | undefined
  readonly serverType?: string | undefined
  readonly location?: string | undefined
  readonly image?: string | undefined
  readonly architecture?: "x86" | "arm" | undefined
  readonly sshKeyName: string
  readonly createFirewall?: boolean | undefined
  readonly adminIpv4?: string | undefined
  readonly adminIpv6?: string | undefined
  readonly rdnsHostname?: string | undefined
}

export interface HetznerMailServer {
  readonly server: hcloud.Server
  readonly firewall: hcloud.Firewall | undefined
  readonly ipv4RdnsRecord: hcloud.Rdns
  readonly serverType: string
  readonly location: string
  readonly image: string
  readonly sshKeyName: pulumi.Output<string>
}

const defaults = {
  name: "mail-vps",
  serverType: "cpx11",
  location: "ash",
  image: "ubuntu-24.04",
  architecture: "x86" as const,
  rdnsHostname: "mx.dsqr.dev",
}

export function asSingleHostCidr(ip: string, family: "ipv4" | "ipv6") {
  return ip.includes("/") ? ip : `${ip}/${family === "ipv4" ? "32" : "128"}`
}

function missingProviderResult(resource: string, message: string) {
  return new PulumiResourceConfigError({ resource, message })
}

export function createHetznerMailServerEffect(
  config: HetznerMailServerConfig,
): Effect.Effect<HetznerMailServer, PulumiResourceConfigError> {
  return Effect.gen(function* () {
    const name = config.name ?? defaults.name
    const serverType = config.serverType ?? defaults.serverType
    const location = config.location ?? defaults.location
    const imageName = config.image ?? defaults.image
    const architecture = config.architecture ?? defaults.architecture
    const createFirewall = config.createFirewall ?? false
    const rdnsHostname = config.rdnsHostname ?? defaults.rdnsHostname

    yield* requireResourceConfigEffect(
      !createFirewall || Boolean(config.adminIpv4 || config.adminIpv6),
      "hetzner-mail:firewall",
      "`hetzner-mail:adminIpv4` or `hetzner-mail:adminIpv6` is required when `hetzner-mail:createFirewall` is true.",
    )

    const sshKey = hcloud.getSshKeyOutput({
      name: config.sshKeyName,
    })

    const resolvedSshKeyName = sshKey.apply((result) => {
      if (!result.name) {
        throw missingProviderResult(
          "hetzner:ssh-key",
          `No Hetzner SSH key found for name "${config.sshKeyName}".`,
        )
      }

      return result.name
    })

    const image = hcloud.getImageOutput({
      name: imageName,
      withArchitecture: architecture,
    })

    const resolvedImageName = image.apply((result) => {
      if (!result.name) {
        throw missingProviderResult(
          "hetzner:image",
          `No Hetzner image found for "${imageName}" with architecture "${architecture}".`,
        )
      }

      return result.name
    })

    const firewallRules = [
      config.adminIpv4
        ? {
            direction: "in" as const,
            protocol: "tcp" as const,
            port: "22",
            sourceIps: [asSingleHostCidr(config.adminIpv4, "ipv4")],
            description: "SSH from home IPv4",
          }
        : undefined,
      config.adminIpv6
        ? {
            direction: "in" as const,
            protocol: "tcp" as const,
            port: "22",
            sourceIps: [asSingleHostCidr(config.adminIpv6, "ipv6")],
            description: "SSH from home IPv6",
          }
        : undefined,
      ...["25", "80", "443", "465", "587", "993", "4190"].map((port) => ({
        direction: "in" as const,
        protocol: "tcp" as const,
        port,
        sourceIps: ["0.0.0.0/0", "::/0"],
        description: `mail service tcp/${port}`,
      })),
    ].filter((rule): rule is NonNullable<typeof rule> => rule !== undefined)

    const firewall = createFirewall
      ? new hcloud.Firewall("mail-firewall", {
          name: `${name}-ssh`,
          labels: {
            role: "mail",
            provider: "hetzner",
            stack: "mail",
          },
          rules: firewallRules,
        })
      : undefined

    const server = new hcloud.Server("mail-vps", {
      name,
      serverType,
      location,
      image: resolvedImageName,
      backups: false,
      deleteProtection: false,
      rebuildProtection: false,
      keepDisk: true,
      publicNets: [
        {
          ipv4Enabled: true,
          ipv6Enabled: true,
        },
      ],
      sshKeys: [resolvedSshKeyName],
      ...(firewall
        ? {
            firewallIds: [firewall.id.apply((id) => Number(id))],
          }
        : {}),
      labels: {
        role: "mail",
        provider: "hetzner",
        stack: "mail",
        os: "bootstrap-linux",
      },
    })

    const ipv4RdnsRecord = new hcloud.Rdns("mail-ipv4-rdns", {
      serverId: server.id.apply((id) => Number(id)),
      ipAddress: server.ipv4Address,
      dnsPtr: rdnsHostname,
    })

    return {
      server,
      firewall,
      ipv4RdnsRecord,
      serverType,
      location,
      image: imageName,
      sshKeyName: resolvedSshKeyName,
    }
  })
}

export function createHetznerMailServer(config: HetznerMailServerConfig): HetznerMailServer {
  return runSyncOrThrow(createHetznerMailServerEffect(config))
}
