import { user } from "@dsqr-dotdev/database/auth-schema"
import type { TRPCRouterRecord } from "@trpc/server"
import { desc, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { logger } from "../lib/logger"
import { adminProcedure, protectedProcedure, publicProcedure } from "../trpc"

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
  adminUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.database
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
      .orderBy(desc(user.createdAt))
  }),
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["admin", "user"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.database
        .update(user)
        .set({
          role: input.role,
        })
        .where(eq(user.id, input.userId))
        .returning({
          id: user.id,
          role: user.role,
          updatedAt: user.updatedAt,
        })

      if (!updatedUser) {
        throw new Error("User not found")
      }

      return updatedUser
    }),
} satisfies TRPCRouterRecord
