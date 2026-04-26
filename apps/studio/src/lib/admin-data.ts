import { database } from "@dsqr-dotdev/database/client"
import { user } from "@dsqr-dotdev/database/auth-schema"
import { postCommentsView, posts, subscribers } from "@dsqr-dotdev/database/schema"
import { createServerFn } from "@tanstack/react-start"
import { desc, eq, sql } from "drizzle-orm"
import { getAdminSessionUser } from "./admin-access"

export const getAdminBootstrap = createServerFn({ method: "GET" }).handler(async () => {
  const adminUser = await getAdminSessionUser()

  if (!adminUser) {
    throw new Error("UNAUTHORIZED")
  }

  const postCommentCounts = database
    .select({
      postId: postCommentsView.postId,
      commentCount: sql<number>`count(*)::int`.as("commentCount"),
    })
    .from(postCommentsView)
    .where(eq(postCommentsView.isActive, true))
    .groupBy(postCommentsView.postId)
    .as("post_comment_counts")

  const [allPosts, allUsers, allSubscribers] = await Promise.all([
    database
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        category: posts.category,
        description: posts.description,
        content: posts.content,
        filePath: posts.filePath,
        headerImageUrl: posts.headerImageUrl,
        likesCount: posts.likesCount,
        viewCount: posts.viewCount,
        tags: posts.tags,
        readingTimeMinutes: posts.readingTimeMinutes,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        published: posts.published,
        date: posts.date,
        commentCount: postCommentCounts.commentCount,
      })
      .from(posts)
      .leftJoin(postCommentCounts, eq(postCommentCounts.postId, posts.id))
      .orderBy(desc(posts.updatedAt)),
    database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        banned: user.banned,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt)),
    database
      .select({
        id: subscribers.id,
        email: subscribers.email,
        active: subscribers.active,
        subscribedAt: subscribers.subscribedAt,
        unsubscribedAt: subscribers.unsubscribedAt,
        unsubscribeToken: subscribers.unsubscribeToken,
      })
      .from(subscribers)
      .orderBy(desc(subscribers.subscribedAt)),
  ])

  return {
    adminUser,
    posts: allPosts.map((post) => ({
      ...post,
      commentCount: post.commentCount ?? 0,
    })),
    users: allUsers,
    subscribers: allSubscribers,
  }
})
