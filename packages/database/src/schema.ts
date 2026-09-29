import { sql } from 'drizzle-orm'
import { check, pgSchema, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const app = pgSchema('app')

export const subscriptions = app.table('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  // The API will validate addresses. Keep one trimmed, lowercase value here;
  // do not strip dots or plus tags, which can identify different mailboxes.
  email: varchar('email', { length: 254 }).notNull().unique(),
  status: text('status', { enum: ['pending', 'subscribed', 'unsubscribed'] })
    .notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
}, (table) => [
  check('subscriptions_email_normalized', sql`${table.email} = lower(btrim(${table.email})) and length(${table.email}) > 0`),
  check('subscriptions_status_valid', sql`${table.status} in ('pending', 'subscribed', 'unsubscribed')`),
  check('subscriptions_unsubscribe_consistent', sql`(${table.status} = 'unsubscribed') = (${table.unsubscribedAt} is not null)`),
])

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
