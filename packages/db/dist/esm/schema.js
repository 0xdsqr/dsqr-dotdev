// src/schema.ts
import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
var emailSubscribers = pgTable("email_subscribers", (t) => ({
  id: t.serial("id").primaryKey(),
  email: t.varchar("email", { length: 255 }).notNull().unique(),
  subscribed_at: t.timestamp("subscribed_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updated_at: t.timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().default(sql`CURRENT_TIMESTAMP`),
  active: t.boolean("active").notNull().default(true),
  unsubscribed_at: t.timestamp("unsubscribed_at", {
    mode: "date",
    withTimezone: true
  }),
  source: t.varchar("source", { length: 100 }),
  tags: t.jsonb("tags").default("{}")
}));
var insertEmailSubscriberSchema = z.object({
  email: z.email().max(255),
  active: z.boolean().optional().default(true),
  source: z.string().max(100).optional(),
  tags: z.any().optional()
});
var selectEmailSubscriberSchema = z.object({
  id: z.number(),
  email: z.email(),
  subscribed_at: z.date(),
  updated_at: z.date(),
  active: z.boolean(),
  unsubscribed_at: z.date().nullable(),
  source: z.string().nullable(),
  tags: z.any().nullable()
});
export {
  selectEmailSubscriberSchema,
  insertEmailSubscriberSchema,
  emailSubscribers
};
