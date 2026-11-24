import { assert, describe, it } from '@effect/vitest'
import { ConfigProvider, Effect, Exit, Layer, Option } from 'effect'
import { clientIp, HttpPolicy, isTrustedOrigin } from '../src/server/policy.server'

type Policy = HttpPolicy['Service']

const trusting = (hops: number): Policy => ({ trustProxy: true, trustedProxyHops: hops, trustedOrigins: [] })
const untrusting: Policy = { trustProxy: false, trustedProxyHops: 0, trustedOrigins: ['https://dsqr.dev'] }

const loadPolicy = (env: Record<string, string>) =>
  Effect.gen(function* () {
    return yield* HttpPolicy
  }).pipe(Effect.provide(HttpPolicy.layer.pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env }))))))

describe('clientIp', () => {
  it('ignores X-Forwarded-For unless a proxy is trusted', () => {
    assert.isTrue(Option.isNone(clientIp(untrusting, { 'x-forwarded-for': '203.0.113.9' })))
  })

  it('selects the configured hop from the right', () => {
    const headers = { 'x-forwarded-for': '198.51.100.1, 203.0.113.9' }
    assert.deepStrictEqual(clientIp(trusting(1), headers), Option.some('203.0.113.9'))
    assert.deepStrictEqual(clientIp(trusting(2), headers), Option.some('198.51.100.1'))
  })

  it('canonicalizes IPv6 and IPv4-mapped addresses into one bucket', () => {
    assert.deepStrictEqual(clientIp(trusting(1), { 'x-forwarded-for': '2001:DB8:0:0::1' }), Option.some('2001:db8::1'))
    assert.deepStrictEqual(clientIp(trusting(1), { 'x-forwarded-for': '::ffff:203.0.113.9' }), Option.some('203.0.113.9'))
  })

  it.each([undefined, '', 'not-an-ip', 'fe80::1%eth0', '203.0.113.9'])(
    'puts a missing or malformed chain (%s) in the shared unresolved bucket',
    (chain) => {
      const headers = chain === undefined ? {} : { 'x-forwarded-for': chain }
      assert.deepStrictEqual(clientIp(trusting(2), headers), Option.some('unresolved'))
    },
  )
})

describe('isTrustedOrigin', () => {
  const url = 'http://dsqr.dev/api/subscriptions'

  it('accepts same-origin fetches, configured origins and the request origin', () => {
    assert.isTrue(isTrustedOrigin(untrusting, url, { 'sec-fetch-site': 'same-origin' }))
    assert.isTrue(isTrustedOrigin(untrusting, url, { origin: 'https://dsqr.dev', host: 'dsqr.dev' }))
    assert.isTrue(isTrustedOrigin(untrusting, url, { origin: 'http://dsqr.dev', host: 'dsqr.dev' }))
  })

  it('rejects foreign or missing origins', () => {
    assert.isFalse(isTrustedOrigin(untrusting, url, { origin: 'https://evil.example', host: 'dsqr.dev' }))
    assert.isFalse(isTrustedOrigin(untrusting, url, { host: 'dsqr.dev' }))
  })

  it('only honours X-Forwarded-Proto behind a trusted proxy', () => {
    const headers = { origin: 'https://dsqr.dev', host: 'dsqr.dev', 'x-forwarded-proto': 'https' }
    assert.isFalse(isTrustedOrigin({ ...untrusting, trustedOrigins: [] }, url, headers))
    assert.isTrue(isTrustedOrigin(trusting(1), url, headers))
  })
})

describe('HttpPolicy.layer', () => {
  it.effect('treats a blank TRUSTED_ORIGINS (Helm renders an empty list) as none', () =>
    Effect.gen(function* () {
      const policy = yield* loadPolicy({ TRUSTED_ORIGINS: '' })
      assert.deepStrictEqual(policy.trustedOrigins, [])
      assert.isFalse(policy.trustProxy)
    }),
  )

  it.effect('parses and trims a comma-separated origin list', () =>
    Effect.gen(function* () {
      const policy = yield* loadPolicy({ TRUSTED_ORIGINS: 'https://dsqr.dev, https://labs.dsqr.dev' })
      assert.deepStrictEqual(policy.trustedOrigins, ['https://dsqr.dev', 'https://labs.dsqr.dev'])
    }),
  )

  it.effect('refuses origins with a path and proxy trust without a hop count', () =>
    Effect.gen(function* () {
      const withPath = yield* Effect.exit(loadPolicy({ TRUSTED_ORIGINS: 'https://dsqr.dev/x' }))
      assert.isTrue(Exit.isFailure(withPath))
      const noHops = yield* Effect.exit(loadPolicy({ TRUST_PROXY: 'true' }))
      assert.isTrue(Exit.isFailure(noHops))
      const hops = yield* loadPolicy({ TRUST_PROXY: 'true', TRUSTED_PROXY_HOPS: '2' })
      assert.strictEqual(hops.trustedProxyHops, 2)
    }),
  )
})
