import { hostname } from 'node:os'
import { fileURLToPath } from 'node:url'
import { NodeRuntime } from '@effect/platform-node'
import { Effect, Schema } from 'effect'
import { Client } from 'pg'
import { MigrationError, rows, runMigrations } from './runner'

const Mode = Schema.Literals(['--check', '--apply'])
const Invocation = Schema.Struct({ host: Schema.Literal('srv-lx-knox'), args: Schema.Literal(3) })
const Identity = Schema.Struct({
  database: Schema.Literal('dsqr-dotdev'),
  login: Schema.Literal('postgres'),
  local: Schema.Literal(true),
  major: Schema.Literal(18),
  owner: Schema.Literal('dsqr-dotdev'),
})
const Role = Schema.Struct({ role: Schema.Literal('dsqr-dotdev'), superuser: Schema.Literal(false) })

const unverified = 'Connection or target/owner verification failed. No migrations executed.'
const invalid =
  'Production migration command failed. Verify target, permissions and migration history; no automatic repair attempted.'

const program = Effect.gen(function* () {
  const mode = yield* Schema.decodeUnknownEffect(Mode)(process.argv[2])
  yield* Schema.decodeUnknownEffect(Invocation)({ host: hostname(), args: process.argv.length })
  const client = yield* Effect.acquireRelease(
    Effect.sync(
      () =>
        new Client({
          host: '/run/postgresql',
          port: 5432,
          user: 'postgres',
          password: '',
          database: 'dsqr-dotdev',
          ssl: false,
          application_name: 'dotdev-production-migrations',
          connectionTimeoutMillis: 10_000,
          statement_timeout: 120_000,
          lock_timeout: 10_000,
          idle_in_transaction_session_timeout: 30_000,
        }),
    ),
    (client) => Effect.promise(() => client.end()),
  )
  yield* Effect.tryPromise({ try: () => client.connect(), catch: () => new MigrationError({ message: unverified }) })
  yield* rows(
    client,
    unverified,
    `SELECT current_database() AS database,
      session_user AS login, inet_server_addr() IS NULL AS local,
      current_setting('server_version_num')::int / 10000 AS major,
      pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = current_database()`,
    Schema.Tuple([Identity]),
  )
  yield* Effect.tryPromise({
    try: () => client.query('SET ROLE "dsqr-dotdev"'),
    catch: () => new MigrationError({ message: unverified }),
  })
  yield* rows(
    client,
    unverified,
    'SELECT current_user AS role, rolsuper AS superuser FROM pg_roles WHERE rolname = current_user',
    Schema.Tuple([Role]),
  )
  yield* runMigrations(client, fileURLToPath(new URL('./migrations', import.meta.url)), mode === '--apply')
}).pipe(
  Effect.scoped,
  // Never echo argv, hostnames or driver errors; report one actionable line and exit 1.
  Effect.catchTag('MigrationError', (error) => Effect.logError(error.message).pipe(Effect.andThen(Effect.fail(error)))),
  Effect.catchTag('SchemaError', () =>
    Effect.sync(() => process.stderr.write(`${invalid}\n`)).pipe(Effect.andThen(Effect.fail(invalid))),
  ),
)

// runMain interrupts on SIGINT/SIGTERM, so the scope still releases the lock and client.
NodeRuntime.runMain(program, { disableErrorReporting: true })
