import { Context, Effect } from 'effect'

export const HealthCheck = Context.Reference<Effect.Effect<void, unknown>>('@dsqr-dotdev/api/HealthCheck', {
  defaultValue: () => Effect.void,
})
