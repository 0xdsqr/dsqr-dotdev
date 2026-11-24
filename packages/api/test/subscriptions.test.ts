import { Database, DatabaseError } from '@dsqr-dotdev/database/server'
import { assert, describe, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { HttpServer } from 'effect/http'
import { HttpApiTest } from 'effect/http-api'
import { DotdevApi } from '../src/api/api'
import { SubscriptionsHandlers } from '../src/server/http/subscriptions.server'

// Records inserts instead of touching PostgreSQL.
const memoryDatabase = (inserted: Array<unknown>) =>
  Layer.succeed(
    Database,
    Database.of({
      query: <A>(_run: unknown) => Effect.sync(() => void inserted.push(_run) as A),
      ping: Effect.void,
    }),
  )

const handlers = (database: Layer.Layer<Database>) =>
  Layer.mergeAll(SubscriptionsHandlers.pipe(Layer.provide(database)), HttpServer.layerServices)

const makeClient = HttpApiTest.groups(DotdevApi, ['subscriptions'])

describe('POST /api/subscriptions', () => {
  it.effect('accepts an address without revealing whether it already exists', () => {
    const inserted: Array<unknown> = []
    return Effect.gen(function* () {
      const client = yield* makeClient
      const first = yield* client.subscriptions.subscribe({ payload: { email: 'Me@dsqr.dev' } })
      const again = yield* client.subscriptions.subscribe({ payload: { email: 'me@dsqr.dev' } })
      assert.deepStrictEqual(first, { status: 'accepted' })
      assert.deepStrictEqual(again, first)
      assert.strictEqual(inserted.length, 2)
    }).pipe(Effect.provide(handlers(memoryDatabase(inserted))))
  })

  it.effect('rate limits a single address after three attempts an hour', () =>
    Effect.gen(function* () {
      const client = yield* makeClient
      for (let i = 0; i < 3; i++) yield* client.subscriptions.subscribe({ payload: { email: 'me@dsqr.dev' } })
      const error = yield* client.subscriptions.subscribe({ payload: { email: 'me@dsqr.dev' } }).pipe(Effect.flip)
      assert.strictEqual(error._tag, 'RateLimited')
    }).pipe(Effect.provide(handlers(memoryDatabase([])))),
  )

  it.effect('turns database failures into a bare server error', () =>
    Effect.gen(function* () {
      const client = yield* makeClient
      const exit = yield* client.subscriptions.subscribe({ payload: { email: 'me@dsqr.dev' } }).pipe(Effect.exit)
      assert.isTrue(exit._tag === 'Failure')
    }).pipe(Effect.provide(handlers(Layer.succeed(Database, Database.unavailable(new DatabaseError({ cause: 'down' })))))),
  )
})
