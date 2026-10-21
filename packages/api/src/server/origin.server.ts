import { Effect, Layer } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/unstable/http'
import { HttpPolicy, isTrustedOrigin } from './policy.server'

export const OriginGuard = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const policy = yield* HttpPolicy
    yield* router.addGlobalMiddleware((httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest
        const write = request.method !== 'GET' && request.method !== 'HEAD'
        if (write && !isTrustedOrigin(policy, request.originalUrl, request.headers)) {
          return HttpServerResponse.text('Cross-origin requests are not allowed.', { status: 403 })
        }
        return yield* httpEffect
      }),
    )
  }),
).pipe(Layer.provide(HttpPolicy.layer))
