import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sql, eq } from 'drizzle-orm'
import { createDatabase } from '../src/client.server.ts'
import { subscriptions } from '../src/schema.ts'

function constraint(name: string) {
  return (error: unknown) => error instanceof Error
    && typeof error.cause === 'object' && error.cause !== null
    && 'constraint' in error.cause && error.cause.constraint === name
}

// Run only in the disposable Nix check. No test mutates the developer database.
test('subscription schema and legacy isolation', async () => {
  assert.ok(process.env.NIX_BUILD_TOP, 'Use nix build .#checks.<system>.database')
  const { db, close } = createDatabase({
    host: process.env.PGHOST, port: 55432, user: 'dsqr_dev', database: 'dsqr_dotdev_dev',
  })
  try {
    const [row] = await db.insert(subscriptions).values({ email: 'reader@example.com' }).returning()
    assert.equal(row.status, 'pending')
    assert.match(row.id, /^[0-9a-f-]{36}$/)
    assert.ok(row.createdAt instanceof Date)
    assert.equal(row.subscribedAt, null)
    assert.equal(row.unsubscribedAt, null)
    await assert.rejects(async () => await db.insert(subscriptions).values({ email: row.email }), constraint('subscriptions_email_unique'))
    for (const email of ['READER@example.com', ' reader@example.com ', '']) {
      await assert.rejects(async () => await db.insert(subscriptions).values({ email }), constraint('subscriptions_email_normalized'))
    }
    await assert.rejects(async () => await db.execute(sql`update app.subscriptions set status = 'invalid'`), constraint('subscriptions_status_valid'))
    await assert.rejects(async () => await db.update(subscriptions).set({ status: 'unsubscribed' }), constraint('subscriptions_unsubscribe_consistent'))
    const confirmed = new Date()
    await db.update(subscriptions).set({ status: 'subscribed', subscribedAt: confirmed }).where(eq(subscriptions.id, row.id))
    await db.update(subscriptions).set({ status: 'unsubscribed', unsubscribedAt: new Date() }).where(eq(subscriptions.id, row.id))
    // Conflict-ignore must not reactivate an existing unsubscribed address.
    await db.insert(subscriptions).values({ email: row.email }).onConflictDoNothing()
    const [saved] = await db.select().from(subscriptions).where(eq(subscriptions.id, row.id))
    assert.equal(saved.status, 'unsubscribed')
    assert.equal(saved.subscribedAt?.getTime(), confirmed.getTime())
    assert.ok(saved.updatedAt.getTime() >= row.updatedAt.getTime())
    assert.deepEqual((await db.execute(sql`select id from public.legacy_sentinel`)).rows, [{ id: 1 }])
    assert.equal((await db.execute(sql`select to_regclass('public.subscriptions') as table_name`)).rows[0].table_name, null)
  } finally {
    await close()
  }
})
