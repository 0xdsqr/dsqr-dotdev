import { createPostSchema, posts } from "@dsqr-dotdev/db/schema"
import { compile } from "@mdx-js/mdx"
import type { TRPCRouterRecord } from "@trpc/server"
import { desc, eq } from "drizzle-orm"
import rehypeHighlight from "rehype-highlight"
import remarkGfm from "remark-gfm"
import { z } from "zod/v4"

import { protectedProcedure, publicProcedure } from "../trpc.js"

const CDN_BASE = "https://cdn.dsqr.dev"

export const postRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.posts.findMany({
      orderBy: desc(posts.id),
      limit: 10,
    })
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
      })
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.posts.findFirst({
        where: eq(posts.slug, input.slug),
      })
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
        console.error("Error fetching post content:", error)
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
} satisfies TRPCRouterRecord
