import { sql } from "drizzle-orm"
import { pgTable } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

export const emailSubscribers = pgTable("email_subscribers", (t) => ({
  id: t.serial("id").primaryKey(),
  email: t.varchar("email", { length: 255 }).notNull().unique(),
  subscribed_at: t
    .timestamp("subscribed_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: t
    .timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  active: t.boolean("active").notNull().default(true),
  unsubscribed_at: t.timestamp("unsubscribed_at", {
    mode: "date",
    withTimezone: true,
  }),
  source: t.varchar("source", { length: 100 }),
  tags: t.jsonb("tags").default("{}"),
}))

export type EmailSubscriber = typeof emailSubscribers.$inferSelect
export type NewEmailSubscriber = typeof emailSubscribers.$inferInsert

export const insertEmailSubscriberSchema = createInsertSchema(
  emailSubscribers,
  {
    email: z.string().email().max(255),
    active: z.boolean().optional(),
    source: z.string().max(100).optional(),
    tags: z.any().optional(),
  },
).omit({
  id: true,
  subscribed_at: true,
  updated_at: true,
  unsubscribed_at: true,
})

export const selectEmailSubscriberSchema = createSelectSchema(emailSubscribers)
