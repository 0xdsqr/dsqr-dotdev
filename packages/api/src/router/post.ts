import {
  createPostCommentSchema,
  createPostSchema,
  postComments,
  postCommentsView,
  posts,
} from "@dsqr-dotdev/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"
import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod/v4"

import { protectedProcedure, publicProcedure } from "../trpc"

const CDN_BASE = "https://cdn.dsqr.dev"

export const postRouter = {
  all: publicProcedure.query(async ({ ctx }) => {
    const postsWithCommentCount = await ctx.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        category: posts.category,
        description: posts.description,
        published: posts.published,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        date: posts.date,
        filePath: posts.filePath,
        headerImageUrl: posts.headerImageUrl,
        readingTimeMinutes: posts.readingTimeMinutes,
        tags: posts.tags,
        likesCount: posts.likesCount,
        commentCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${postCommentsView}
          WHERE ${postCommentsView.postId} = ${posts.id}
          AND ${postCommentsView.isActive} = true
        )`.as("commentCount"),
      })
      .from(posts)
      .orderBy(desc(posts.date))
      .limit(10)

    return postsWithCommentCount
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [post] = await ctx.db
        .select()
        .from(posts)
        .where(eq(posts.id, input.id))

      return post
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(posts)
        .where(eq(posts.slug, input.slug))
        .limit(1)

      return result[0] || null
    }),

  content: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input }) => {
      try {
        const url = `${CDN_BASE}/${input.filePath}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`)
        }

        const mdxContent = await response.text()

        return { success: true, content: mdxContent }
      } catch (error) {
        return {
          success: false,
          content: "",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(posts).values(input)
    }),

  delete: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.delete(posts).where(eq(posts.id, input))
  }),

  like: protectedProcedure
    .input(z.object({ postId: z.string(), increment: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.postId),
      })

      if (!post) {
        throw new Error("Post not found")
      }

      const newLikeCount = input.increment
        ? post.likesCount + 1
        : Math.max(post.likesCount - 1, 0)

      await ctx.db
        .update(posts)
        .set({
          likesCount: newLikeCount,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.postId))

      return newLikeCount
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const allComments = await ctx.db
        .select()
        .from(postCommentsView)
        .where(
          and(
            eq(postCommentsView.postId, input.postId),
            eq(postCommentsView.isActive, true),
          ),
        )
        .orderBy(desc(postCommentsView.createdAt))

      type CommentWithReplies = (typeof allComments)[0] & {
        replies: CommentWithReplies[]
      }
      const commentMap = new Map<string, CommentWithReplies>(
        allComments.map((c) => [c.id, { ...c, replies: [] }]),
      )

      for (const comment of allComments) {
        if (
          comment.parentCommentId &&
          commentMap.has(comment.parentCommentId)
        ) {
          const parent = commentMap.get(comment.parentCommentId)
          const child = commentMap.get(comment.id)
          if (parent && child) {
            parent.replies.push(child)
          }
        }
      }

      const topLevel = allComments.filter((c) => !c.parentCommentId)
      return topLevel
        .map((c) => commentMap.get(c.id))
        .filter((c) => c !== undefined) as CommentWithReplies[]
    }),

  commentCount: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(postCommentsView)
        .where(
          and(
            eq(postCommentsView.postId, input.postId),
            eq(postCommentsView.isActive, true),
          ),
        )

      return result[0]?.count || 0
    }),

  createComment: protectedProcedure
    .input(createPostCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const [post] = await ctx.db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.id, input.postId))

      if (!post) {
        throw new Error("Post not found")
      }

      if (input.parentCommentId) {
        const [parentComment] = await ctx.db
          .select({ id: postComments.id })
          .from(postComments)
          .where(eq(postComments.id, input.parentCommentId))

        if (!parentComment) {
          throw new Error("Parent comment not found")
        }
      }

      const result = await ctx.db
        .insert(postComments)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning()

      return result[0]
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [comment] = await ctx.db
        .select()
        .from(postComments)
        .where(eq(postComments.id, input.commentId))

      if (!comment) {
        throw new Error("Comment not found")
      }

      if (comment.userId !== ctx.session.user.id) {
        throw new Error("You can only delete your own comments")
      }

      const result = await ctx.db
        .update(postComments)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(postComments.id, input.commentId))
        .returning()

      return result[0]
    }),
} satisfies TRPCRouterRecord
