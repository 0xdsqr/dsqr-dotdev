import {
  createPostCommentSchema,
  createPostSchema,
  postComments,
  postCommentsView,
  posts,
  updatePostSchema,
} from "@dsqr-dotdev/database/schema"
import type { TRPCRouterRecord } from "@trpc/server"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod/v4"
import { getPostContent, uploadPostContent, uploadPostImage } from "../lib/s3"
import { adminProcedure, protectedProcedure, publicProcedure } from "../trpc"

const publicPostSelection = {
  id: posts.id,
  title: posts.title,
  slug: posts.slug,
  category: posts.category,
  description: posts.description,
  date: posts.date,
  headerImageUrl: posts.headerImageUrl,
  readingTimeMinutes: posts.readingTimeMinutes,
  tags: posts.tags,
  likesCount: posts.likesCount,
}

export const publicPostContentInput = z
  .object({
    postId: z.string().uuid(),
  })
  .strict()

export function publishedPostWhere(postId: string) {
  return and(eq(posts.id, postId), eq(posts.published, true))
}

type StoredPostContent = {
  readonly content: string | null
  readonly filePath: string | null
}

async function resolveStoredPostContent(post: StoredPostContent | undefined) {
  if (!post) {
    return { success: false as const, content: "", error: "Post not found" }
  }

  if (post.content !== null) {
    return { success: true as const, content: post.content }
  }

  if (!post.filePath) {
    return { success: false as const, content: "", error: "No content source available" }
  }

  try {
    const content = await getPostContent(post.filePath)

    if (content === null) {
      return { success: false as const, content: "", error: "Post content not found" }
    }

    return { success: true as const, content }
  } catch {
    return { success: false as const, content: "", error: "Failed to fetch content" }
  }
}

export type PublicCommentRow = {
  readonly id: string
  readonly userId: string
  readonly parentCommentId: string | null
  readonly content: string
  readonly createdAt: Date
  readonly updatedAt: Date | null
  readonly userName: unknown
  readonly userImage: unknown
}

export type PublicComment = {
  readonly id: string
  readonly parentCommentId: string | null
  readonly content: string
  readonly createdAt: Date
  readonly updatedAt: Date | null
  readonly userName: string
  readonly userImage: string
  readonly isOwner: boolean
  readonly replies: PublicComment[]
}

function publicString(value: unknown) {
  return typeof value === "string" ? value : ""
}

export function buildPublicCommentTree(
  rows: ReadonlyArray<PublicCommentRow>,
  currentUserId: string | null,
): PublicComment[] {
  const commentMap = new Map<string, PublicComment>(
    rows.map((comment) => [
      comment.id,
      {
        id: comment.id,
        parentCommentId: comment.parentCommentId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        userName: publicString(comment.userName),
        userImage: publicString(comment.userImage),
        isOwner: currentUserId !== null && currentUserId === comment.userId,
        replies: [],
      },
    ]),
  )

  for (const comment of rows) {
    if (!comment.parentCommentId) {
      continue
    }

    const parent = commentMap.get(comment.parentCommentId)
    const child = commentMap.get(comment.id)
    if (parent && child) {
      parent.replies.push(child)
    }
  }

  return rows
    .filter((comment) => !comment.parentCommentId)
    .map((comment) => commentMap.get(comment.id))
    .filter((comment): comment is PublicComment => comment !== undefined)
}

export const publicPostRouter = {
  all: publicProcedure.query(async ({ ctx }) => {
    const postsList = await ctx.database
      .select(publicPostSelection)
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.date))

    const postIds = postsList.map((post) => post.id)
    const commentCounts =
      postIds.length === 0
        ? []
        : await ctx.database
            .select({
              postId: postCommentsView.postId,
              commentCount: sql<number>`count(*)::int`.as("commentCount"),
            })
            .from(postCommentsView)
            .where(
              and(eq(postCommentsView.isActive, true), inArray(postCommentsView.postId, postIds)),
            )
            .groupBy(postCommentsView.postId)

    const commentCountByPostId = new Map(commentCounts.map((row) => [row.postId, row.commentCount]))

    return postsList.map((post) => ({
      ...post,
      commentCount: commentCountByPostId.get(post.id) ?? 0,
    }))
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }).strict())
    .query(async ({ ctx, input }) => {
      const [post] = await ctx.database
        .select(publicPostSelection)
        .from(posts)
        .where(publishedPostWhere(input.id))
        .limit(1)

      return post ?? null
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(256) }).strict())
    .query(async ({ ctx, input }) => {
      const [post] = await ctx.database
        .select(publicPostSelection)
        .from(posts)
        .where(and(eq(posts.slug, input.slug), eq(posts.published, true)))
        .limit(1)

      return post ?? null
    }),

  content: publicProcedure.input(publicPostContentInput).query(async ({ ctx, input }) => {
    const [post] = await ctx.database
      .select({ content: posts.content, filePath: posts.filePath })
      .from(posts)
      .where(publishedPostWhere(input.postId))
      .limit(1)

    return resolveStoredPostContent(post)
  }),

  like: protectedProcedure
    .input(z.object({ postId: z.string().uuid(), increment: z.boolean() }).strict())
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.database.query.posts.findFirst({
        where: publishedPostWhere(input.postId),
      })

      if (!post) {
        throw new Error("Post not found")
      }

      const newLikeCount = input.increment ? post.likesCount + 1 : Math.max(post.likesCount - 1, 0)

      await ctx.database
        .update(posts)
        .set({
          likesCount: newLikeCount,
          updatedAt: new Date(),
        })
        .where(publishedPostWhere(input.postId))

      return newLikeCount
    }),

  getComments: publicProcedure
    .input(z.object({ postId: z.string().uuid() }).strict())
    .query(async ({ ctx, input }) => {
      const allComments = await ctx.database
        .select({
          id: postCommentsView.id,
          userId: postCommentsView.userId,
          parentCommentId: postCommentsView.parentCommentId,
          content: postCommentsView.content,
          createdAt: postCommentsView.createdAt,
          updatedAt: postCommentsView.updatedAt,
          userName: postCommentsView.userName,
          userImage: postCommentsView.userImage,
        })
        .from(postCommentsView)
        .innerJoin(posts, eq(postCommentsView.postId, posts.id))
        .where(
          and(
            eq(postCommentsView.postId, input.postId),
            eq(postCommentsView.isActive, true),
            eq(posts.published, true),
          ),
        )
        .orderBy(desc(postCommentsView.createdAt))

      return buildPublicCommentTree(allComments, ctx.session?.user.id ?? null)
    }),

  commentCount: publicProcedure
    .input(z.object({ postId: z.string().uuid() }).strict())
    .query(async ({ ctx, input }) => {
      const result = await ctx.database
        .select({ count: sql<number>`count(*)::int` })
        .from(postCommentsView)
        .innerJoin(posts, eq(postCommentsView.postId, posts.id))
        .where(
          and(
            eq(postCommentsView.postId, input.postId),
            eq(postCommentsView.isActive, true),
            eq(posts.published, true),
          ),
        )

      return result[0]?.count ?? 0
    }),

  createComment: protectedProcedure
    .input(createPostCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const [post] = await ctx.database
        .select({ id: posts.id })
        .from(posts)
        .where(publishedPostWhere(input.postId))

      if (!post) {
        throw new Error("Post not found")
      }

      if (input.parentCommentId) {
        const [parentComment] = await ctx.database
          .select({ id: postComments.id })
          .from(postComments)
          .where(
            and(
              eq(postComments.id, input.parentCommentId),
              eq(postComments.postId, input.postId),
              eq(postComments.isActive, true),
            ),
          )

        if (!parentComment) {
          throw new Error("Parent comment not found")
        }
      }

      const result = await ctx.database
        .insert(postComments)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning()

      return result[0]
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      const [comment] = await ctx.database
        .select()
        .from(postComments)
        .where(eq(postComments.id, input.commentId))

      if (!comment) {
        throw new Error("Comment not found")
      }

      if (comment.userId !== ctx.session.user.id) {
        throw new Error("You can only delete your own comments")
      }

      const result = await ctx.database
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

export const adminPostRouter = {
  create: adminProcedure.input(createPostSchema).mutation(async ({ ctx, input }) => {
    const [post] = await ctx.database.insert(posts).values(input).returning()
    return post
  }),

  update: adminProcedure
    .input(z.object({ id: z.string().uuid(), data: updatePostSchema }).strict())
    .mutation(async ({ ctx, input }) => {
      const cleanData = Object.fromEntries(
        Object.entries(input.data).filter(([_, value]) => value !== undefined),
      )

      const [post] = await ctx.database
        .update(posts)
        .set(cleanData)
        .where(eq(posts.id, input.id))
        .returning({ id: posts.id })
      return { success: true, id: post?.id }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      await ctx.database.delete(posts).where(eq(posts.id, input.id))
      return { success: true }
    }),

  adminAll: adminProcedure.query(async ({ ctx }) => {
    const postsList = await ctx.database
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
      })
      .from(posts)
      .orderBy(desc(posts.updatedAt))

    const postIds = postsList.map((post) => post.id)
    const commentCounts =
      postIds.length === 0
        ? []
        : await ctx.database
            .select({
              postId: postCommentsView.postId,
              commentCount: sql<number>`count(*)::int`.as("commentCount"),
            })
            .from(postCommentsView)
            .where(
              and(eq(postCommentsView.isActive, true), inArray(postCommentsView.postId, postIds)),
            )
            .groupBy(postCommentsView.postId)

    const commentCountByPostId = new Map(commentCounts.map((row) => [row.postId, row.commentCount]))

    return postsList.map((post) => ({
      ...post,
      commentCount: commentCountByPostId.get(post.id) ?? 0,
    }))
  }),

  content: adminProcedure.input(publicPostContentInput).query(async ({ ctx, input }) => {
    const [post] = await ctx.database
      .select({ content: posts.content, filePath: posts.filePath })
      .from(posts)
      .where(eq(posts.id, input.postId))
      .limit(1)

    return resolveStoredPostContent(post)
  }),

  saveContent: adminProcedure
    .input(
      z
        .object({
          id: z.string().uuid(),
          slug: z.string(),
          content: z.string(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const filePath = await uploadPostContent(input.slug, input.content)

      const [post] = await ctx.database
        .update(posts)
        .set({
          filePath,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.id))
        .returning()

      return { success: true, filePath, post }
    }),

  uploadImage: adminProcedure
    .input(
      z
        .object({
          slug: z.string(),
          fileName: z.string(),
          fileType: z.string(),
          fileData: z.string(),
        })
        .strict(),
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileData, "base64")
      const imagePath = await uploadPostImage(input.slug, buffer, input.fileName, input.fileType)
      return { success: true, url: imagePath }
    }),
} satisfies TRPCRouterRecord
