import { assert, describe, it } from '@effect/vitest'
import { Effect } from 'effect'
import { TestClock } from 'effect/testing'
import { RateLimiter, type RatePolicy } from '../src/server/rate-limiter.server'

const policy: RatePolicy = { name: 'test', limit: 2, window: '1 minute' }

const attempts = (key: string, count: number) =>
  Effect.gen(function* () {
    const limiter = yield* RateLimiter
    const results: Array<boolean> = []
    for (let i = 0; i < count; i++) results.push(yield* limiter.allow(policy, key))
    return results
  })

describe('RateLimiter', () => {
  it.effect('allows up to the limit, then refuses within the window', () =>
    Effect.gen(function* () {
      assert.deepStrictEqual(yield* attempts('a', 3), [true, true, false])
    }).pipe(Effect.provide(RateLimiter.layer)),
  )

  it.effect('keeps keys independent', () =>
    Effect.gen(function* () {
      yield* attempts('a', 3)
      assert.deepStrictEqual(yield* attempts('b', 1), [true])
    }).pipe(Effect.provide(RateLimiter.layer)),
  )

  it.effect('opens a fresh window once the old one expires', () =>
    Effect.gen(function* () {
      yield* attempts('a', 3)
      yield* TestClock.adjust('1 minute')
      assert.deepStrictEqual(yield* attempts('a', 1), [true])
    }).pipe(Effect.provide(RateLimiter.layer)),
  )
})
