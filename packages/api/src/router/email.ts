import { createSubscriberSchema, subscribers } from "@dsqr-dotdev/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"
import { logger } from "../lib/logger.js"
import { publicProcedure } from "../trpc.js"

const log = logger

export const emailRouter = {
  subscribe: publicProcedure
    .input(createSubscriberSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .insert(subscribers)
          .values(input)
          .returning()
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
} satisfies TRPCRouterRecord
