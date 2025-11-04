import { eq, relations, sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgTable,
  pgView,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { user } from "./auth-schema.js"

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    title: varchar("title", { length: 256 }).notNull(),
    slug: varchar("slug", { length: 256 }).notNull().unique(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description").notNull(),

    filePath: varchar("file_path", { length: 512 }).notNull(),
    headerImageUrl: varchar("header_image_url", { length: 512 }),

    likesCount: integer("likes_count").default(0).notNull(),
    viewCount: integer("view_count").default(0).notNull(),

    tags: text("tags").array().default(sql`ARRAY[]::text[]`),
    readingTimeMinutes: integer("reading_time_minutes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => sql`now()`),

    published: boolean("published").default(true).notNull(),
  },
  (table) => [
    index("posts_slug_idx").on(table.slug),
    index("posts_date_idx").on(table.date),
    index("posts_category_idx").on(table.category),
    index("posts_published_idx").on(table.published),
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_published_date_idx").on(table.published, table.date),
  ],
)

export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),

    parentCommentId: uuid("parent_comment_id"),

    content: text("content").notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index("post_comments_post_id_idx").on(table.postId),
    index("post_comments_user_id_idx").on(table.userId),
    index("post_comments_parent_id_idx").on(table.parentCommentId),
    index("post_comments_post_id_created_at_idx").on(
      table.postId,
      table.createdAt,
    ),
  ],
)

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    active: boolean("active").default(true).notNull(),

    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),

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

export const postCommentsView = pgView("post_comments_view").as((qb) => {
  return qb
    .select({
      id: postComments.id,
      postId: postComments.postId,
      userId: postComments.userId,
      parentCommentId: postComments.parentCommentId,
      content: postComments.content,
      isActive: postComments.isActive,
      createdAt: postComments.createdAt,
      updatedAt: postComments.updatedAt,
      userName: sql`COALESCE(${user.name}, '')`.as("user_name"),
      userEmail: sql`COALESCE(${user.email}, '')`.as("user_email"),
      userImage: sql`COALESCE(${user.image}, '')`.as("user_image"),
      userRole: sql`COALESCE(${user.role}, '')`.as("user_role"),
      userBanned: sql`COALESCE(${user.banned}, false)`.as("user_banned"),
    })
    .from(postComments)
    .leftJoin(user, eq(postComments.userId, user.id))
})

export const postsRelations = relations(posts, ({ many }) => ({
  comments: many(postComments),
}))

export const postCommentsRelations = relations(
  postComments,
  ({ one, many }) => ({
    post: one(posts, {
      fields: [postComments.postId],
      references: [posts.id],
    }),
    parent: one(postComments, {
      fields: [postComments.parentCommentId],
      references: [postComments.id],
      relationName: "parent",
    }),
    replies: many(postComments, {
      relationName: "parent",
    }),
  }),
)

export const subscribersRelations = relations(subscribers, () => ({}))

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

export const createPostCommentSchema = createInsertSchema(postComments, {
  content: z.string().min(1).max(1000),
  postId: z.string().uuid(),
  parentCommentId: z.string().uuid().optional(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
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

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert

export type PostComment = typeof postComments.$inferSelect
export type NewPostComment = typeof postComments.$inferInsert

export type Subscriber = typeof subscribers.$inferSelect
export type NewSubscriber = typeof subscribers.$inferInsert

export * from "./auth-schema.js"
