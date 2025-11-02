import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

// ──────────────────────────────────────────────
// Posts Table
// ──────────────────────────────────────────────

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),

    // Frontmatter fields
    title: varchar("title", { length: 256 }).notNull(),
    slug: varchar("slug", { length: 256 }).notNull().unique(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description").notNull(),

    // File and media
    filePath: varchar("file_path", { length: 512 }).notNull(),
    headerImageUrl: varchar("header_image_url", { length: 512 }),

    // Engagement
    likesCount: integer("likes_count").default(0).notNull(),
    viewCount: integer("view_count").default(0).notNull(),

    // Additional fields
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    readingTimeMinutes: integer("reading_time_minutes"),

    // Meta
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => sql`now()`),

    // Publishing
    published: boolean("published").default(true).notNull(),
  },
  (table) => [
    index("posts_slug_idx").on(table.slug),
    index("posts_date_idx").on(table.date),
    index("posts_category_idx").on(table.category),
    index("posts_published_idx").on(table.published),
    index("posts_created_at_idx").on(table.createdAt),
    // Composite index for common queries
    index("posts_published_date_idx").on(table.published, table.date),
  ],
)

// ──────────────────────────────────────────────
// Subscribers Table
// ──────────────────────────────────────────────

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),

    // Status
    active: boolean("active").default(true).notNull(),

    // Timestamps
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),

    // Unsubscribe token
    unsubscribeToken: varchar("unsubscribe_token", { length: 128 })
      .notNull()
      .unique()
      .default(sql`gen_random_uuid()::text`),
  },
  (table) => [
    index("subscribers_email_idx").on(table.email),
    index("subscribers_active_idx").on(table.active),
    index("subscribers_unsubscribe_token_idx").on(table.unsubscribeToken),
  ],
)

// ──────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────

export const createPostSchema = createInsertSchema(posts, {
  title: z.string().min(1).max(256),
  slug: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[a-z0-9-]+$/),
  date: z.coerce.date(),
  category: z.string().min(1).max(100),
  description: z.string().min(1),
  filePath: z.string().min(1).max(512),
  headerImageUrl: z.string().url().max(512).optional(),
  tags: z.array(z.string()).optional(),
  readingTimeMinutes: z.number().int().positive().optional(),
  likesCount: z.number().int().nonnegative().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
})

export const createSubscriberSchema = createInsertSchema(subscribers, {
  email: z.string().email().max(255),
}).omit({
  id: true,
  subscribedAt: true,
  active: true,
  unsubscribedAt: true,
  unsubscribeToken: true,
})

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Subscriber = typeof subscribers.$inferSelect
export type NewSubscriber = typeof subscribers.$inferInsert

// ──────────────────────────────────────────────
// Re-exports
// ──────────────────────────────────────────────

export * from "./auth-schema"
