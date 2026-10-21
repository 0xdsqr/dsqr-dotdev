import { isIP } from 'node:net'
import { Config, Context, Effect, Layer, Option, Schema } from 'effect'

export class HttpPolicy extends Context.Service<
  HttpPolicy,
  {
    readonly trustProxy: boolean
    readonly trustedProxyHops: number
    readonly trustedOrigins: ReadonlyArray<string>
  }
>()('@dsqr-dotdev/api/HttpPolicy') {
  static readonly layer = Layer.effect(
    HttpPolicy,
    Effect.gen(function* () {
      const trustProxy = yield* Config.boolean('TRUST_PROXY').pipe(Config.withDefault(false))
      // Enabling trust requires an explicit, bounded count; never guess the chain.
      const trustedProxyHops = trustProxy
        ? yield* Config.schema(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 16 })), 'TRUSTED_PROXY_HOPS')
        : 0
      const trustedOrigins = (yield* Config.string('TRUSTED_ORIGINS').pipe(Config.withDefault('')))
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
      return HttpPolicy.of({ trustProxy, trustedProxyHops, trustedOrigins })
    }),
  ).pipe(Layer.orDie)
}

export const clientIp = (policy: HttpPolicy['Service'], headers: Readonly<Record<string, string | undefined>>) => {
  if (!policy.trustProxy) return Option.none<string>()
  const chain = headers['x-forwarded-for']?.split(',').map((hop) => hop.trim()) ?? []
  const trusted = chain.slice(-policy.trustedProxyHops)
  // Missing/malformed trusted hops share a bounded bucket, never bypass the limiter.
  if (trusted.length !== policy.trustedProxyHops || !trusted.every(Schema.is(IpAddress))) return Option.some('unresolved')
  const address = trusted[0]!
  if (isIP(address) === 4) return Option.some(address)
  // Normalize equivalent IPv6 spellings so they cannot obtain separate buckets.
  const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1)
  const mapped = canonical.match(/^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/)
  if (mapped) {
    const high = Number.parseInt(mapped[1]!, 16)
    const low = Number.parseInt(mapped[2]!, 16)
    return Option.some([high >> 8, high & 255, low >> 8, low & 255].join('.'))
  }
  return Option.some(canonical)
}

const IpAddress = Schema.String.check(Schema.makeFilter((value) => isIP(value) !== 0 && !value.includes('%')))

const lastHop = (value: string | undefined) => value?.split(',').at(-1)?.trim() || undefined

export const requestOrigin = (
  policy: HttpPolicy['Service'],
  url: string,
  headers: Readonly<Record<string, string | undefined>>,
) => {
  if (!URL.canParse(url)) return undefined
  const parsed = new URL(url)
  const forwardedProto = policy.trustProxy ? lastHop(headers['x-forwarded-proto']) : undefined
  const scheme = forwardedProto === 'https' || forwardedProto === 'http' ? forwardedProto : parsed.protocol.slice(0, -1)
  return `${scheme}://${headers['host'] ?? parsed.host}`
}

export const isTrustedOrigin = (
  policy: HttpPolicy['Service'],
  url: string,
  headers: Readonly<Record<string, string | undefined>>,
) => {
  if (headers['sec-fetch-site'] === 'same-origin') return true
  const origin = headers['origin']
  if (origin === undefined) return false
  if (policy.trustedOrigins.includes(origin)) return true
  return origin === requestOrigin(policy, url, headers)
}
