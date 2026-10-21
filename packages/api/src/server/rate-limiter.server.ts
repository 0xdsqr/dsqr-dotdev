import { Clock, Context, Duration, Effect, Layer } from 'effect'

export interface RatePolicy {
  readonly name: string
  readonly limit: number
  readonly window: Duration.Input
}

const MAX_WINDOWS = 10_000

export class RateLimiter extends Context.Service<
  RateLimiter,
  {
    allow(policy: RatePolicy, key: string): Effect.Effect<boolean>
  }
>()('@dsqr-dotdev/api/RateLimiter') {
  static readonly layer = Layer.sync(RateLimiter, () => {
    const windows = new Map<string, { count: number; resetAt: number }>()

    const makeRoom = (now: number) => {
      if (windows.size < MAX_WINDOWS) return
      for (const [slot, window] of windows) if (window.resetAt <= now) windows.delete(slot)
      for (const slot of windows.keys()) {
        if (windows.size < MAX_WINDOWS) break
        windows.delete(slot)
      }
    }

    const allow = Effect.fn('RateLimiter.allow')(function* (policy: RatePolicy, key: string) {
      const now = yield* Clock.currentTimeMillis
      const slot = `${policy.name}:${key}`
      const current = windows.get(slot)
      if (current && current.resetAt > now) {
        current.count += 1
        return current.count <= policy.limit
      }
      windows.delete(slot)
      makeRoom(now)
      windows.set(slot, { count: 1, resetAt: now + Duration.toMillis(policy.window) })
      return true
    })

    return RateLimiter.of({ allow })
  })
}
