import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"
import {
  Effect,
  PulumiResourceConfigError,
  requireResourceConfigEffect,
  runSyncOrThrow,
} from "@dsqr-dotdev/effect-pulumi-core"

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

function requireZoneIdEffect(
  zoneIds: Readonly<Record<string, string>>,
  zone: string,
  resource: string,
): Effect.Effect<string, PulumiResourceConfigError> {
  const zoneId = zoneIds[zone]

  if (zoneId) {
    return Effect.succeed(zoneId)
  }

  return Effect.fail(
    new PulumiResourceConfigError({
      resource,
      message: `Missing Cloudflare zone id for zone "${zone}".`,
    }),
  )
}

export function createCloudflareEdgeEffect(args: CloudflareEdgeArgs) {
  return Effect.gen(function* () {
    const ingressRules = yield* Effect.forEach(args.ingressRules, (rule) =>
      requireZoneIdEffect(args.zoneIds, rule.zone, `ingress:${rule.hostname}`).pipe(
        Effect.map((zoneId) => ({ rule, zoneId })),
      ),
    )
    const directRecords = yield* Effect.forEach(args.dnsRecords ?? [], (record) =>
      requireZoneIdEffect(args.zoneIds, record.zone, `dns:${record.type}:${record.name}`).pipe(
        Effect.map((zoneId) => ({ record, zoneId })),
      ),
    )
    const accessApplicationSpecs = yield* Effect.forEach(
      args.accessApplications ?? [],
      (application) =>
        requireResourceConfigEffect(
          application.allowedEmails.length > 0,
          `access:${application.hostname}`,
          `Cloudflare Access application "${application.name}" needs at least one allowed email.`,
        ).pipe(Effect.map(() => application)),
    )

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
      ingressRules.map(({ rule, zoneId }) => {
        const record = new cloudflare.DnsRecord(resourceName(rule.hostname), {
          zoneId,
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
      directRecords.map(({ record, zoneId }) => {
        const dnsRecord = new cloudflare.DnsRecord(resourceName(`${record.type}-${record.name}`), {
          zoneId,
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
      accessApplicationSpecs.map((application) => {
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
  })
}

export function createCloudflareEdge(args: CloudflareEdgeArgs) {
  return runSyncOrThrow(createCloudflareEdgeEffect(args))
}
