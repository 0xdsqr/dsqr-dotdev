import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"

export type CloudflareIngressRule = {
  readonly hostname: string
  readonly zone: string
  readonly service: string
  readonly originRequest?: {
    readonly http2Origin?: boolean
    readonly httpHostHeader?: string
    readonly noTlsVerify?: boolean
    readonly originServerName?: string
  }
}

export type CloudflareDnsRecord = {
  readonly zone: string
  readonly name: string
  readonly type: "A" | "AAAA" | "CNAME" | "MX" | "TXT"
  readonly content: string
  readonly proxied?: boolean
  readonly ttl?: number
  readonly priority?: number
}

export type CloudflareR2Bucket = {
  readonly name: string
  readonly location?: "apac" | "eeur" | "enam" | "weur" | "wnam" | "oc"
  readonly jurisdiction?: "default" | "eu" | "fedramp"
  readonly storageClass?: "Standard" | "InfrequentAccess"
}

export type CloudflareAccessApplication = {
  readonly name: string
  readonly hostname: string
  readonly allowedEmails: ReadonlyArray<string>
  readonly sessionDuration?: string
}

export type CloudflareEdgeArgs = {
  accountId: string
  tunnelSecret: pulumi.Input<string>
  zoneIds: Readonly<Record<string, string>>
  zones: Readonly<Record<string, string>>
  tunnel: {
    name: string
    defaultService: string
  }
  dnsRecords?: ReadonlyArray<
    Omit<CloudflareDnsRecord, "content"> & {
      content: pulumi.Input<string>
    }
  >
  r2Buckets?: ReadonlyArray<CloudflareR2Bucket>
  accessApplications?: ReadonlyArray<CloudflareAccessApplication>
  ingressRules: ReadonlyArray<CloudflareIngressRule>
}

function resourceName(hostname: string) {
  return hostname.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function requireZoneId(zoneIds: Readonly<Record<string, string>>, zone: string) {
  const zoneId = zoneIds[zone]

  if (!zoneId) {
    throw new Error(`Missing Cloudflare zone id for zone "${zone}".`)
  }

  return zoneId
}

export function createCloudflareEdge(args: CloudflareEdgeArgs) {
  const tunnel = new cloudflare.ZeroTrustTunnelCloudflared("gateway", {
    accountId: args.accountId,
    name: args.tunnel.name,
    configSrc: "cloudflare",
    tunnelSecret: args.tunnelSecret,
  })

  const tunnelCname = pulumi.interpolate`${tunnel.id}.cfargotunnel.com`

  const tunnelConfig = new cloudflare.ZeroTrustTunnelCloudflaredConfig("gateway-config", {
    accountId: args.accountId,
    tunnelId: tunnel.id,
    source: "cloudflare",
    config: {
      ingresses: [
        ...args.ingressRules.map((rule) => ({
          hostname: rule.hostname,
          service: rule.service,
          ...(rule.originRequest
            ? {
                originRequest: rule.originRequest,
              }
            : undefined),
        })),
        {
          service: args.tunnel.defaultService,
        },
      ],
    },
  })

  const dnsRecords = Object.fromEntries(
    args.ingressRules.map((rule) => {
      const record = new cloudflare.DnsRecord(resourceName(rule.hostname), {
        zoneId: requireZoneId(args.zoneIds, rule.zone),
        name: rule.hostname,
        type: "CNAME",
        content: tunnelCname,
        proxied: true,
        ttl: 1,
      })

      return [rule.hostname, record]
    }),
  )

  const directDnsRecords = Object.fromEntries(
    (args.dnsRecords ?? []).map((record) => {
      const dnsRecord = new cloudflare.DnsRecord(resourceName(`${record.type}-${record.name}`), {
        zoneId: requireZoneId(args.zoneIds, record.zone),
        name: record.name,
        type: record.type,
        content: record.content,
        ttl: record.ttl ?? 1,
        ...(record.priority != null ? { priority: record.priority } : {}),
        ...(record.proxied != null ? { proxied: record.proxied } : {}),
      })

      return [`${record.type}:${record.name}`, dnsRecord]
    }),
  )

  const r2Buckets = Object.fromEntries(
    (args.r2Buckets ?? []).map((bucket) => {
      const r2Bucket = new cloudflare.R2Bucket(resourceName(bucket.name), {
        accountId: args.accountId,
        name: bucket.name,
        ...(bucket.location ? { location: bucket.location } : {}),
        ...(bucket.jurisdiction ? { jurisdiction: bucket.jurisdiction } : {}),
        ...(bucket.storageClass ? { storageClass: bucket.storageClass } : {}),
      })

      return [
        bucket.name,
        {
          name: r2Bucket.name,
          location: r2Bucket.location,
          jurisdiction: r2Bucket.jurisdiction,
          storageClass: r2Bucket.storageClass,
        },
      ]
    }),
  )

  const accessApplications = Object.fromEntries(
    (args.accessApplications ?? []).map((application) => {
      if (application.allowedEmails.length === 0) {
        throw new Error(
          `Cloudflare Access application "${application.name}" needs at least one allowed email.`,
        )
      }

      const sessionDuration = application.sessionDuration ?? "8h"

      const accessApplication = new cloudflare.ZeroTrustAccessApplication(
        resourceName(`access-${application.hostname}`),
        {
          accountId: args.accountId,
          name: application.name,
          domain: application.hostname,
          type: "self_hosted",
          appLauncherVisible: false,
          enableBindingCookie: true,
          httpOnlyCookieAttribute: true,
          sameSiteCookieAttribute: "strict",
          sessionDuration,
          policies: [
            {
              name: `${application.name} admins`,
              decision: "allow",
              includes: application.allowedEmails.map((email) => ({
                email: {
                  email,
                },
              })),
              precedence: 1,
            },
          ],
        },
      )

      return [
        application.hostname,
        {
          aud: accessApplication.aud,
          domain: accessApplication.domain,
          name: accessApplication.name,
        },
      ]
    }),
  )

  const tunnelToken = pulumi.secret(
    tunnel.id.apply((tunnelId) =>
      cloudflare
        .getZeroTrustTunnelCloudflaredToken({
          accountId: args.accountId,
          tunnelId,
        })
        .then((result) => result.token),
    ),
  )

  return {
    accountId: args.accountId,
    dnsZones: args.zones,
    hostnames: [
      ...Object.keys(dnsRecords),
      ...(args.dnsRecords ?? []).map((record) => record.name),
    ],
    directDnsRecords,
    r2Buckets,
    accessApplications,
    tunnelCname,
    tunnelId: tunnel.id,
    tunnelName: tunnel.name,
    tunnelToken,
    configVersion: tunnelConfig.version,
  }
}
