import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"
import { isIP } from "node:net"
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
  readonly insecureOriginReason?: string
  readonly originRequest?: {
    readonly http2Origin?: boolean
    readonly httpHostHeader?: string
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

export type CloudflareZoneSecurityPolicy = {
  readonly strictTransportSecurity: {
    readonly includeSubdomains: boolean
    readonly maxAge: number
    readonly preload: boolean
  }
}

export type CloudflareEdgeArgs = {
  accountId: string
  tunnelSecret: pulumi.Input<string>
  zoneIds: Readonly<Record<string, string>>
  zones: Readonly<Record<string, string>>
  zoneSecurity: Readonly<Record<string, CloudflareZoneSecurityPolicy>>
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

export function cloudflareZoneSecuritySettings(policy: CloudflareZoneSecurityPolicy) {
  return {
    alwaysUseHttps: {
      settingId: "always_use_https",
      value: "on",
    },
    automaticHttpsRewrites: {
      settingId: "automatic_https_rewrites",
      value: "on",
    },
    minimumTlsVersion: {
      settingId: "min_tls_version",
      value: "1.2",
    },
    tls13: {
      settingId: "tls_1_3",
      value: "on",
    },
    strictOriginTls: {
      settingId: "ssl",
      value: "strict",
    },
    strictTransportSecurity: {
      settingId: "security_header",
      value: {
        strictTransportSecurity: {
          enabled: true,
          includeSubdomains: policy.strictTransportSecurity.includeSubdomains,
          maxAge: policy.strictTransportSecurity.maxAge,
          nosniff: true,
          preload: policy.strictTransportSecurity.preload,
        },
      },
    },
  } as const
}

function resourceName(hostname: string) {
  return hostname
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-/, "")
    .replace(/-$/, "")
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

function isPrivateHttpOrigin(hostname: string) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase()

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return true
  }

  const addressFamily = isIP(normalized)
  if (addressFamily === 4) {
    const octets = normalized.split(".").map(Number)
    const first = octets[0]
    const second = octets[1]

    return (
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    )
  }

  if (addressFamily === 6) {
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd")
  }

  return normalized.endsWith(".home.arpa")
}

export function validateCloudflareIngressRuleEffect(
  rule: CloudflareIngressRule,
): Effect.Effect<void, PulumiResourceConfigError> {
  return Effect.try({
    try: () => new URL(rule.service),
    catch: () =>
      new PulumiResourceConfigError({
        resource: `ingress:${rule.hostname}`,
        message: `Cloudflare ingress origin for "${rule.hostname}" must be an absolute HTTP(S) URL.`,
      }),
  }).pipe(
    Effect.flatMap((origin) => {
      if (origin.username || origin.password) {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: `ingress:${rule.hostname}`,
            message: `Cloudflare ingress origin for "${rule.hostname}" must not contain embedded credentials.`,
          }),
        )
      }

      const disablesTlsVerification =
        (rule.originRequest as { readonly noTlsVerify?: unknown } | undefined)?.noTlsVerify === true

      if (disablesTlsVerification) {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: `ingress:${rule.hostname}`,
            message: `Cloudflare ingress origin for "${rule.hostname}" cannot disable TLS verification.`,
          }),
        )
      }

      if (origin.protocol === "http:") {
        if (!isPrivateHttpOrigin(origin.hostname)) {
          return Effect.fail(
            new PulumiResourceConfigError({
              resource: `ingress:${rule.hostname}`,
              message: `Plain HTTP origin for "${rule.hostname}" must be loopback, RFC1918, ULA, or a private home.arpa host.`,
            }),
          )
        }

        return rule.insecureOriginReason && rule.insecureOriginReason.trim().length >= 20
          ? Effect.void
          : Effect.fail(
              new PulumiResourceConfigError({
                resource: `ingress:${rule.hostname}`,
                message: `Plain HTTP origin for "${rule.hostname}" requires a specific migration justification.`,
              }),
            )
      }

      if (origin.protocol !== "https:") {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: `ingress:${rule.hostname}`,
            message: `Cloudflare ingress origin for "${rule.hostname}" must use HTTP or HTTPS.`,
          }),
        )
      }

      if (
        isIP(origin.hostname.replace(/^\[|\]$/g, "")) !== 0 &&
        !rule.originRequest?.originServerName
      ) {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: `ingress:${rule.hostname}`,
            message: `HTTPS origin for "${rule.hostname}" uses an IP address and requires originServerName for certificate verification.`,
          }),
        )
      }

      return Effect.void
    }),
  )
}

export function createCloudflareEdgeEffect(args: CloudflareEdgeArgs) {
  return Effect.gen(function* () {
    const ingressRules = yield* Effect.forEach(args.ingressRules, (rule) =>
      Effect.gen(function* () {
        yield* validateCloudflareIngressRuleEffect(rule)
        const zoneId = yield* requireZoneIdEffect(
          args.zoneIds,
          rule.zone,
          `ingress:${rule.hostname}`,
        )
        return { rule, zoneId }
      }),
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
    const zoneSecurityPolicies = yield* Effect.forEach(Object.keys(args.zoneIds), (zone) =>
      requireResourceConfigEffect(
        args.zoneSecurity[zone] !== undefined,
        `zone-security:${zone}`,
        `Cloudflare zone "${zone}" needs an explicit HSTS rollout policy.`,
      ).pipe(Effect.map(() => [zone, args.zoneSecurity[zone]!] as const)),
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

    const zoneSecurity = Object.fromEntries(
      zoneSecurityPolicies.map(([zone, policy]) => {
        const zoneId = args.zoneIds[zone]!
        const settings = Object.fromEntries(
          Object.entries(cloudflareZoneSecuritySettings(policy)).map(([name, setting]) => {
            const zoneSetting = new cloudflare.ZoneSetting(
              resourceName(`${zone}-${setting.settingId}`),
              {
                zoneId,
                settingId: setting.settingId,
                value: setting.value,
              },
            )

            return [name, zoneSetting.value]
          }),
        )

        return [zone, settings]
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
      zoneSecurity,
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
