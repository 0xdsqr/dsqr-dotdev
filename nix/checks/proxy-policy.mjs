// Run from the repository/build root, through stdin so imports use that root.
import assert from 'node:assert/strict'
import { ConfigProvider, Effect, Exit, Option } from 'effect'
import { clientIp, HttpPolicy, requestOrigin } from './packages/api/src/server/policy.server.ts'

const policy = { trustProxy: true, trustedProxyHops: 2, trustedOrigins: ['https://dsqr.dev'] }
const ip = (xff, selected = policy) => Option.getOrUndefined(clientIp(selected, { 'x-forwarded-for': xff }))

assert.equal(ip('192.0.2.1, 10.80.1.2'), '192.0.2.1')
assert.equal(ip('198.51.100.99, 192.0.2.1, 10.80.1.2'), '192.0.2.1')
assert.equal(ip('spoofed, 192.0.2.1, 10.80.1.2'), '192.0.2.1')
assert.equal(ip('192.0.2.1, 10.80.1.2', { ...policy, trustProxy: false }), undefined)
assert.equal(ip('192.0.2.1', { ...policy, trustedProxyHops: 1 }), '192.0.2.1')
for (const invalid of [undefined, '', '192.0.2.1', ', 10.80.1.2', 'unknown, 10.80.1.2',
  '192.0.2.1, unknown', '192.0.2.1:443, 10.80.1.2', '[2001:db8::1], 10.80.1.2',
  'fe80::1%eth0, 10.80.1.2']) {
  assert.equal(ip(invalid), 'unresolved', 'Malformed chains must not skip the per-client limiter')
}
assert.equal(ip('2001:0DB8:0000:0000:0000:0000:0000:0001, 10.80.1.2'), '2001:db8::1')
assert.equal(ip('2001:db8::1, 10.80.1.2'), '2001:db8::1')
assert.equal(ip('::ffff:192.0.2.1, 10.80.1.2'), '192.0.2.1')
assert.equal(ip('::ffff:c000:201, 10.80.1.2'), '192.0.2.1')
assert.equal(Option.getOrUndefined(clientIp(policy, { 'cf-connecting-ip': '198.51.100.99' })), 'unresolved')
assert.equal(requestOrigin(policy, 'http://dsqr.dev/', { 'x-forwarded-proto': 'https' }), 'https://dsqr.dev')
assert.equal(requestOrigin({ ...policy, trustProxy: false }, 'http://dsqr.dev/', { 'x-forwarded-proto': 'https' }), 'http://dsqr.dev')

const load = (env) => Effect.runPromiseExit(HttpPolicy.pipe(
  Effect.provide(HttpPolicy.layer),
  Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromUnknown(env)),
))
assert.ok(Exit.isSuccess(await load({})))
for (const value of [undefined, '0', '-1', '17', '1.5', 'invalid']) {
  assert.ok(Exit.isFailure(await load({ TRUST_PROXY: '1', ...(value === undefined ? {} : { TRUSTED_PROXY_HOPS: value }) })))
}
const configured = await load({ TRUST_PROXY: '1', TRUSTED_PROXY_HOPS: '2' })
assert.ok(Exit.isSuccess(configured))
assert.equal(configured.value.trustedProxyHops, 2)
console.log('Trusted proxy count, spoofed prefixes, malformed chains, IP normalization, and safe defaults passed')
