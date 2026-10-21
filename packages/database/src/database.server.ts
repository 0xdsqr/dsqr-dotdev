import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Config, Context, Effect, Layer, Option, Redacted, Schema } from 'effect'
import { Pool, type PoolConfig } from 'pg'
import * as schema from './schema'

export type Drizzle = NodePgDatabase<typeof schema>

export class DatabaseError extends Schema.TaggedError<DatabaseError>()('DatabaseError', {
  cause: Schema.Defect(),
}) {}

type Target = 'local' | 'remote'

const localSocket = fileURLToPath(new URL('../../../.local/postgres/socket', import.meta.url))

const poolDefaults: PoolConfig = {
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  maxLifetimeSeconds: 30 * 60,
  statement_timeout: 10_000,
  idle_in_transaction_session_timeout: 10_000,
}

const connectionFields = (url: URL, ca: string): PoolConfig => {
  const decoded = (value: string) => (value ? decodeURIComponent(value) : undefined)
  return {
    host: url.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: url.port ? Number(url.port) : 5432,
    user: decoded(url.username),
    password: decoded(url.password),
    database: decoded(url.pathname.slice(1)),
    application_name: url.searchParams.get('application_name') ?? undefined,
    ssl: { ca, rejectUnauthorized: true },
  }
}

const configError = (message: string) => new DatabaseError({ cause: new Error(message) })

export const DatabaseConfig = Effect.gen(function* () {
  const production = (yield* Config.string('NODE_ENV').pipe(Config.withDefault('development'))) === 'production'
  const selected = yield* Config.literals(['local', 'remote'], 'DSQR_DATABASE').pipe(Config.withDefault('local'))

  if (!production && selected === 'local') {
    const host = yield* Config.string('LOCAL_DATABASE_SOCKET').pipe(Config.withDefault(localSocket))
    return { target: 'local' as Target, pool: { host, port: 55432, user: 'dsqr_dev', database: 'dsqr_dotdev_dev' } }
  }

  const url = yield* Config.redacted('DATABASE_URL')
  const parsed = yield* Effect.try({
    try: () => new URL(Redacted.value(url)),
    catch: () => configError('DATABASE_URL is not a valid URL'),
  })
  const caPath = yield* Config.option(Config.string('PGSSLROOTCERT'))

  if (Option.isSome(caPath)) {
    const ca = yield* Effect.try({
      try: () => readFileSync(caPath.value, 'utf8'),
      catch: (cause) => new DatabaseError({ cause }),
    })
    return { target: 'remote' as Target, pool: connectionFields(parsed, ca) }
  }
  if (production) return yield* configError('PGSSLROOTCERT is required in production')
  return { target: 'remote' as Target, pool: { connectionString: Redacted.value(url) } }
})

export class Database extends Context.Service<
  Database,
  {
    query<A>(run: (db: Drizzle) => Promise<A>): Effect.Effect<A, DatabaseError>
    readonly ping: Effect.Effect<void, DatabaseError>
  }
>()('@dsqr-dotdev/database/Database') {
  static readonly make = Effect.fn('Database.make')(function* (target: Target, config: PoolConfig) {
    const runFork = Effect.runForkWith(yield* Effect.context())
    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => {
        const pool = new Pool({ ...poolDefaults, ...config })
        pool.on('error', (error) => runFork(Effect.logError('Idle database client error', error)))
        return pool
      }),
      (pool) => Effect.promise(() => pool.end()),
    )
    const db = drizzle(pool, { schema })

    const query = <A>(run: (db: Drizzle) => Promise<A>) =>
      Effect.tryPromise({ try: () => run(db), catch: (cause) => new DatabaseError({ cause }) }).pipe(
        Effect.withSpan('Database.query'),
      )

    const ping = query((db) => db.execute(sql`select 1`)).pipe(
      Effect.timeout('2 seconds'),
      Effect.catchTag('TimeoutError', (cause) => Effect.fail(new DatabaseError({ cause }))),
      Effect.asVoid,
    )

    yield* Effect.logInfo(`Using the ${target} database`)
    return Database.of({ query, ping })
  })

  static readonly unavailable = (cause: unknown) => {
    const error = cause instanceof DatabaseError ? cause : new DatabaseError({ cause })
    return Database.of({ query: () => Effect.fail(error), ping: Effect.fail(error) })
  }

  static readonly layer = Layer.effect(
    Database,
    DatabaseConfig.pipe(
      Effect.flatMap(({ target, pool }) => Database.make(target, pool)),
      Effect.catch((cause) =>
        Effect.logWarning('Database unavailable', cause).pipe(Effect.as(Database.unavailable(cause))),
      ),
    ),
  )
}
