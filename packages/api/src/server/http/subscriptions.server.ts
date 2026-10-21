import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { DotdevApi } from '../../api/api'
import { clientIp, HttpPolicy } from '../policy.server'
import { Subscriptions } from '../subscriptions.server'

export const SubscriptionsHandlers = HttpApiBuilder.group(
  DotdevApi,
  'subscriptions',
  Effect.fn(function* (handlers) {
    const subscriptions = yield* Subscriptions
    const policy = yield* HttpPolicy

    return handlers.handle(
      'subscribe',
      Effect.fn(function* ({ payload, request }) {
        yield* subscriptions
          .subscribe(payload.email, clientIp(policy, request.headers))
          .pipe(Effect.catchTag('DatabaseError', Effect.die))
        return { status: 'accepted' as const }
      }),
    )
  }),
).pipe(Layer.provide([Subscriptions.layer, HttpPolicy.layer]))
