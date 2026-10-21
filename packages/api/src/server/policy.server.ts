import { Config, Context, Effect, Layer, Option } from 'effect'

export class HttpPolicy extends Context.Service<
  HttpPolicy,
  {
    readonly trustProxy: boolean
    readonly trustedOrigins: ReadonlyArray<string>
  }
>()('@dsqr-dotdev/api/HttpPolicy') {
  static readonly layer = Layer.effect(
    HttpPolicy,
    Effect.gen(function* () {
      const trustProxy = yield* Config.boolean('TRUST_PROXY').pipe(Config.withDefault(false))
      const trustedOrigins = (yield* Config.string('TRUSTED_ORIGINS').pipe(Config.withDefault('')))
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
      return HttpPolicy.of({ trustProxy, trustedOrigins })
    }),
  ).pipe(Layer.orDie)
}

export const clientIp = (policy: HttpPolicy['Service'], headers: Readonly<Record<string, string | undefined>>) => {
  if (!policy.trustProxy) return Option.none<string>()
  const hop = lastHop(headers['x-forwarded-for'])
  return hop ? Option.some(hop) : Option.none<string>()
}

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
