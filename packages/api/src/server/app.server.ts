import { Database } from '@dsqr-dotdev/database/server'
import { Effect, Layer } from 'effect'
import { HttpRouter, HttpServer } from 'effect/unstable/http'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { AppApi, DotdevApi } from '../api/api'
import { BodyTooLargeError, readBody } from './body.server'
import { AppHealthHandlers, DotdevHealthHandlers } from './http/health.server'
import { SubscriptionsHandlers } from './http/subscriptions.server'
import { HealthCheck } from './health-check.server'
import { LoggerLive } from './logging.server'
import { OriginGuard } from './origin.server'
import { ProbeRoutes } from './probes.server'

const DatabaseHealthCheck = Layer.effect(
  HealthCheck,
  Effect.gen(function* () {
    const database = yield* Database
    return database.ping
  }),
)

export const DotdevApp = Layer.mergeAll(
  HttpApiBuilder.layer(DotdevApi).pipe(Layer.provide([DotdevHealthHandlers, SubscriptionsHandlers])),
  ProbeRoutes.pipe(Layer.provide(DatabaseHealthCheck)),
  OriginGuard,
).pipe(Layer.provide([Database.layer, HttpServer.layerServices]), Layer.provideMerge(LoggerLive))

export const AppApp = Layer.mergeAll(
  HttpApiBuilder.layer(AppApi).pipe(Layer.provide(AppHealthHandlers)),
  ProbeRoutes,
  OriginGuard,
).pipe(Layer.provide(HttpServer.layerServices), Layer.provideMerge(LoggerLive))

const withBodyCap = (handle: (request: Request) => Promise<Response>) => async (request: Request) => {
  if (request.method === 'GET' || request.method === 'HEAD') return handle(request)
  const headers = new Headers(request.headers)
  headers.delete('content-length')
  try {
    const body = await readBody(request)
    return handle(new Request(request.url, { method: request.method, headers, body }))
  } catch (error) {
    if (error instanceof BodyTooLargeError) return new Response(error.message, { status: 413 })
    throw error
  }
}

interface WebHandler {
  readonly handler: (request: Request) => Promise<Response>
  readonly dispose: () => Promise<void>
}

const lazyWebHandler = (app: Layer.Layer<never, never, HttpRouter.HttpRouter>) => {
  let web: WebHandler | undefined
  return withBodyCap((request) => {
    web ??= HttpRouter.toWebHandler(app)
    return web.handler(request)
  })
}

export const dotdevHandler = lazyWebHandler(DotdevApp)
export const appHandler = lazyWebHandler(AppApp)
