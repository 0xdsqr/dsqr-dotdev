import { Database, type DatabaseError } from '@dsqr-dotdev/database/server'
import { subscriptions } from '@dsqr-dotdev/database/schema'
import { Context, Effect, Layer, Option } from 'effect'
import { RateLimited } from '../domain/subscription'
import { RateLimiter, type RatePolicy } from './rate-limiter.server'

const perAddress: RatePolicy = { name: 'subscribe:address', limit: 3, window: '1 hour' }
const perClient: RatePolicy = { name: 'subscribe:client', limit: 20, window: '10 minutes' }
const overall: RatePolicy = { name: 'subscribe:all', limit: 500, window: '10 minutes' }

export class Subscriptions extends Context.Service<
  Subscriptions,
  {
    subscribe(email: string, clientIp: Option.Option<string>): Effect.Effect<void, RateLimited | DatabaseError>
  }
>()('@dsqr-dotdev/api/Subscriptions') {
  static readonly layer = Layer.effect(
    Subscriptions,
    Effect.gen(function* () {
      const database = yield* Database
      const limiter = yield* RateLimiter

      const subscribe = Effect.fn('Subscriptions.subscribe')(function* (email: string, clientIp: Option.Option<string>) {
        const allowed =
          (yield* limiter.allow(overall, 'all')) &&
          (Option.isNone(clientIp) || (yield* limiter.allow(perClient, clientIp.value))) &&
          (yield* limiter.allow(perAddress, email))
        if (!allowed) return yield* new RateLimited()

        yield* database.query((db) =>
          db.insert(subscriptions).values({ email }).onConflictDoNothing({ target: subscriptions.email }),
        )
      })

      return Subscriptions.of({ subscribe })
    }),
  ).pipe(Layer.provide(RateLimiter.layer))
}
