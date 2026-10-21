import { Effect } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/unstable/http'
import { HealthCheck } from './health-check.server'

const plain = (body: string, status: number) =>
  HttpServerResponse.text(body, { status, headers: { 'cache-control': 'no-store' } })

export const ProbeRoutes = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const healthCheck = yield* HealthCheck
    yield* router.add('GET', '/api/livez', plain('ok', 200))
    yield* router.add(
      'GET',
      '/api/healthz',
      healthCheck.pipe(
        Effect.as(plain('ok', 200)),
        Effect.catch((error) => Effect.logWarning('Health check failed', error).pipe(Effect.as(plain('unavailable', 503)))),
      ),
    )
  }),
)
