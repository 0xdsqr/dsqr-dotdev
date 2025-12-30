import { user } from "@dsqr-dotdev/db/auth-schema"
import type { TRPCRouterRecord } from "@trpc/server"
import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { logger } from "../lib/logger"
import { uploadAvatarToMinIO } from "../lib/minio"
import { protectedProcedure, publicProcedure } from "../trpc"

const log = logger

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    const userId = ctx.session?.user?.id
    if (userId) {
      log.debug("Session retrieved", { userId })
    }
    return ctx.session
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can see this secret message!"
  }),
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        image: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1)

      if (!existingUser.length) {
        throw new Error("User not found")
      }

      const result = await ctx.db
        .update(user)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.image && { image: input.image }),
        })
        .where(eq(user.id, ctx.session.user.id))
        .returning()

      return result[0]
    }),
  uploadAvatar: protectedProcedure
    .input(
      z.object({
        fileData: z.string(), // base64 encoded file data
        fileName: z.string(),
        fileType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      log.debug("Avatar upload started", { userId, fileName: input.fileName })

      const buffer = Buffer.from(input.fileData, "base64")

      if (buffer.length > 5 * 1024 * 1024) {
        log.warn("Avatar file too large", { userId, size: buffer.length })
        throw new Error("File size must be less than 5MB")
      }

      if (!input.fileType.startsWith("image/")) {
        log.warn("Invalid file type", { userId, fileType: input.fileType })
        throw new Error("File must be an image")
      }

      try {
        const cdnUrl = await uploadAvatarToMinIO(
          userId,
          buffer,
          input.fileName,
          input.fileType,
        )
        log.info("Avatar uploaded successfully", {
          userId,
          fileName: input.fileName,
        })
        return { url: cdnUrl }
      } catch (error) {
        log.error("Avatar upload failed", {
          userId,
          fileName: input.fileName,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        throw error
      }
    }),
} satisfies TRPCRouterRecord
