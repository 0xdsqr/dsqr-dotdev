import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Effect, Schema } from 'effect'
import type { Client } from 'pg'

export class MigrationError extends Schema.TaggedError<MigrationError>()('MigrationError', {
  message: Schema.String,
}) {}

const step = <A>(message: string, run: () => Promise<A>) =>
  Effect.tryPromise({ try: run, catch: () => new MigrationError({ message }) })

/**
 * Runs a query and decodes all of its rows with `shape` (`Schema.Tuple([Row])` for
 * exactly one row), so unexpected catalog or journal shapes fail closed.
 */
export const rows = <A>(client: Client, message: string, text: string, shape: Schema.Decoder<A>) =>
  step(message, () => client.query(text)).pipe(
    Effect.flatMap((result) => Schema.decodeUnknownEffect(shape)(result.rows)),
    Effect.mapError(() => new MigrationError({ message })),
  )

const JournalLookup = Schema.Struct({ journal: Schema.NullOr(Schema.String) })
const JournalRow = Schema.Struct({ hash: Schema.String, created_at: Schema.Union([Schema.String, Schema.Number]) })
const SchemaPresence = Schema.Struct({ present: Schema.Boolean })

export const runMigrations = Effect.fn('Database.runMigrations')(function* (
  client: Client,
  folder: string,
  apply: boolean,
) {
  const migrations = yield* Effect.try({
    try: () => readMigrationFiles({ migrationsFolder: folder }),
    catch: () => new MigrationError({ message: 'Cannot read the packaged migration history.' }),
  })
  if (
    migrations.length === 0 ||
    migrations.some((m, i) => i > 0 && m.folderMillis <= migrations[i - 1]!.folderMillis)
  ) {
    return yield* new MigrationError({ message: 'Migration history is empty or not strictly ordered.' })
  }

  const locked = yield* step('Cannot acquire migration lock.', () =>
    client.query('SELECT pg_try_advisory_lock(734252, 12001) AS locked'),
  )
  yield* Schema.decodeUnknownEffect(Schema.Struct({ locked: Schema.Literal(true) }))(locked.rows[0]).pipe(
    Effect.mapError(() => new MigrationError({ message: 'Another migration runner is active.' })),
  )

  return yield* Effect.gen(function* () {
    const [lookup] = yield* rows(
      client,
      'Cannot inspect migration history.',
      "SELECT to_regclass('app_migrations.__drizzle_migrations')::text AS journal",
      Schema.Tuple([JournalLookup]),
    )
    const history =
      lookup.journal === null
        ? []
        : yield* rows(
            client,
            'Cannot read migration history.',
            'SELECT hash, created_at FROM app_migrations.__drizzle_migrations ORDER BY created_at, id',
            Schema.Array(JournalRow),
          )
    if (
      history.length > migrations.length ||
      history.some(
        (row, i) => row.hash !== migrations[i]!.hash || String(row.created_at) !== String(migrations[i]!.folderMillis),
      )
    ) {
      return yield* new MigrationError({
        message: 'Applied migrations do not match this release. Refusing to proceed.',
      })
    }
    const [app] = yield* rows(
      client,
      'Cannot inspect application schema.',
      "SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app') AS present",
      Schema.Tuple([SchemaPresence]),
    )
    const { present } = app
    if (history.length === 0 && present) {
      return yield* new MigrationError({
        message: 'app exists without tracked migrations. Do not baseline it automatically.',
      })
    }
    if (history.length > 0 && !present) {
      return yield* new MigrationError({ message: 'Tracked application schema is missing. Refusing automatic repair.' })
    }
    const pending = migrations.length - history.length
    yield* Effect.logInfo(`Migration preflight: ${history.length} applied, ${pending} pending.`)
    if (apply && pending > 0) {
      yield* step('Migration failed; inspect the database before retrying.', () =>
        migrate(drizzle(client), {
          migrationsFolder: folder,
          migrationsSchema: 'app_migrations',
          migrationsTable: '__drizzle_migrations',
        }),
      )
      yield* Effect.logInfo('Migration completed. Runtime grants and credentials are a separate step.')
    }
  }).pipe(
    Effect.ensuring(
      step('Cannot release migration lock.', () => client.query('SELECT pg_advisory_unlock(734252, 12001)')).pipe(
        Effect.orDie,
      ),
    ),
  )
})
