import { hostname } from 'node:os'
import { fileURLToPath } from 'node:url'
import { Effect, Schema } from 'effect'
import { Client } from 'pg'
import { MigrationError, runMigrations } from './runner'

const program = Effect.gen(function* () {
  const mode = yield* Schema.decodeUnknownEffect(Schema.Literals(['--check', '--apply']))(process.argv[2])
  yield* Schema.decodeUnknownEffect(Schema.Struct({ host: Schema.Literal('srv-lx-knox'), args: Schema.Literal(3) }))({
    host: hostname(), args: process.argv.length,
  })
  const client = yield* Effect.acquireRelease(
    Effect.sync(() => new Client({
      host: '/run/postgresql', port: 5432, user: 'postgres', password: '',
      database: 'dsqr-dotdev', ssl: false,
      application_name: 'dotdev-production-migrations',
      connectionTimeoutMillis: 10_000, statement_timeout: 120_000,
      lock_timeout: 10_000, idle_in_transaction_session_timeout: 30_000,
    })),
    (client) => Effect.promise(() => client.end()),
  )
  yield* Effect.tryPromise({
    try: async () => {
      await client.connect()
      const identity = await client.query(`SELECT current_database() AS database,
        session_user AS login, inet_server_addr() IS NULL AS local,
        current_setting('server_version_num')::int / 10000 AS major,
        pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = current_database()`)
      Schema.decodeUnknownSync(Schema.Struct({
        database: Schema.Literal('dsqr-dotdev'), login: Schema.Literal('postgres'),
        local: Schema.Literal(true), major: Schema.Literal(18), owner: Schema.Literal('dsqr-dotdev'),
      }))(identity.rows[0])
      await client.query('SET ROLE "dsqr-dotdev"')
      const role = await client.query('SELECT current_user AS role, rolsuper AS superuser FROM pg_roles WHERE rolname = current_user')
      Schema.decodeUnknownSync(Schema.Struct({ role: Schema.Literal('dsqr-dotdev'), superuser: Schema.Literal(false) }))(role.rows[0])
    },
    catch: () => new MigrationError({ message: 'Connection or target/owner verification failed. No migrations executed.' }),
  })
  yield* runMigrations(client, fileURLToPath(new URL('./migrations', import.meta.url)), mode === '--apply')
}).pipe(Effect.scoped)

Effect.runPromise(program.pipe(
  Effect.catchTag('MigrationError', (error) => Effect.logError(error.message).pipe(
    Effect.andThen(Effect.sync(() => { process.exitCode = 1 })),
  )),
)).catch(() => {
  process.stderr.write('Production migration command failed. Verify target, permissions and migration history; no automatic repair attempted.\n')
  process.exitCode = 1
})
