import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Effect } from 'effect'
import { Client } from 'pg'
import { runMigrations } from '../../packages/database/migrate/runner'

const client = new Client()
const contender = new Client()
const folder = resolve('packages/database/migrations')
const run = (apply: boolean, path = folder) => Effect.runPromise(runMigrations(client, path, apply))
await client.connect()
await contender.connect()
try {
  await client.query('CREATE ROLE "dsqr-dotdev" NOLOGIN NOSUPERUSER')
  await client.query('GRANT CREATE ON DATABASE dsqr_dotdev_dev TO "dsqr-dotdev"')
  await client.query('SET ROLE "dsqr-dotdev"')
  await run(false)
  assert.equal((await client.query("SELECT to_regnamespace('app_migrations') AS journal")).rows[0].journal, null)
  await client.query('CREATE SCHEMA app')
  await assert.rejects(run(true))
  await client.query('DROP SCHEMA app')
  await contender.query('SELECT pg_advisory_lock(734252, 12001)')
  await assert.rejects(run(true))
  await contender.query('SELECT pg_advisory_unlock(734252, 12001)')
  await run(true)
  await run(true)
  assert.equal((await client.query('SELECT count(*)::int AS count FROM app_migrations.__drizzle_migrations')).rows[0].count, 1)
  assert.equal((await client.query("SELECT tableowner FROM pg_tables WHERE schemaname='app' AND tablename='subscriptions'")).rows[0].tableowner, 'dsqr-dotdev')

  await client.query("UPDATE app_migrations.__drizzle_migrations SET hash = 'tampered' RETURNING id")
  await assert.rejects(run(true))
  const { readMigrationFiles } = await import('drizzle-orm/migrator')
  await client.query('UPDATE app_migrations.__drizzle_migrations SET hash = $1', [readMigrationFiles({ migrationsFolder: folder })[0]!.hash])

  const broken = mkdtempSync(join(tmpdir(), 'migration-check-'))
  cpSync(folder, broken, { recursive: true })
  const journal = JSON.parse(readFileSync(join(broken, 'meta/_journal.json'), 'utf8'))
  journal.entries.push({ idx: 1, version: '7', when: journal.entries[0].when + 1, tag: '0001_broken', breakpoints: true })
  writeFileSync(join(broken, 'meta/_journal.json'), JSON.stringify(journal))
  writeFileSync(join(broken, '0001_broken.sql'), 'CREATE TABLE app.rollback_sentinel (id integer);\n--> statement-breakpoint\nSELECT 1/0;')
  await assert.rejects(run(true, broken))
  assert.equal((await client.query("SELECT to_regclass('app.rollback_sentinel') AS sentinel")).rows[0].sentinel, null)
  assert.equal((await client.query('SELECT count(*)::int AS count FROM app_migrations.__drizzle_migrations')).rows[0].count, 1)
  await client.query('RESET ROLE')
  assert.equal((await client.query('SELECT count(*)::int AS count FROM public.legacy_sentinel')).rows[0].count, 1)
} finally {
  await contender.end()
  await client.end()
}
