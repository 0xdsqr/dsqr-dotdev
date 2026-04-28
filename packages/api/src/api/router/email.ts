import { createSubscriberSchema, subscribers } from "@dsqr-dotdev/database/schema"
import type { TRPCRouterRecord } from "@trpc/server"
import { desc } from "drizzle-orm"
import { logger } from "../lib/logger"
import { adminProcedure, publicProcedure } from "../trpc"

const log = logger

export const emailRouter = {
  subscribe: publicProcedure.input(createSubscriberSchema).mutation(async ({ ctx, input }) => {
    try {
      const result = await ctx.database.insert(subscribers).values(input).returning()
      log.info("Newsletter subscriber added", { email: input.email })
      return result
    } catch (error) {
      log.warn("Newsletter subscription failed", {
        email: input.email,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }),
  adminSubscribers: adminProcedure.query(async ({ ctx }) => {
    return ctx.database
      .select({
        id: subscribers.id,
        email: subscribers.email,
        active: subscribers.active,
        subscribedAt: subscribers.subscribedAt,
        unsubscribedAt: subscribers.unsubscribedAt,
        unsubscribeToken: subscribers.unsubscribeToken,
      })
      .from(subscribers)
      .orderBy(desc(subscribers.subscribedAt))
  }),
} satisfies TRPCRouterRecord
