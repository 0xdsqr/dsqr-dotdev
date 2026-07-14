import { createSubscriberSchema, subscribers } from "@dsqr-dotdev/database/schema"
import { TRPCError, type TRPCRouterRecord } from "@trpc/server"
import { desc } from "drizzle-orm"
import { logger } from "../lib/logger"
import { adminProcedure, publicProcedure } from "../trpc"

const log = logger

export const subscriptionAccepted = () => ({ success: true as const })

function databaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return typeof error.code === "string" ? error.code : null
  }

  return null
}

export function isUniqueConstraintViolation(error: unknown) {
  return databaseErrorCode(error) === "23505"
}

export function handleSubscriptionError(error: unknown) {
  if (isUniqueConstraintViolation(error)) {
    return subscriptionAccepted()
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unable to process subscription",
  })
}

export const adminSubscriberSelection = {
  id: subscribers.id,
  email: subscribers.email,
  active: subscribers.active,
  subscribedAt: subscribers.subscribedAt,
  unsubscribedAt: subscribers.unsubscribedAt,
}

export const publicEmailRouter = {
  subscribe: publicProcedure.input(createSubscriberSchema).mutation(async ({ ctx, input }) => {
    try {
      await ctx.database.insert(subscribers).values(input).returning({ id: subscribers.id })
      log.info("Newsletter subscriber added")
      return subscriptionAccepted()
    } catch (error) {
      log.warn("Newsletter subscription failed", {
        databaseCode: databaseErrorCode(error) ?? "unknown",
        errorType: error instanceof Error ? error.name : "UnknownError",
      })
      return handleSubscriptionError(error)
    }
  }),
} satisfies TRPCRouterRecord

export const adminEmailRouter = {
  adminSubscribers: adminProcedure.query(async ({ ctx }) => {
    return ctx.database
      .select(adminSubscriberSelection)
      .from(subscribers)
      .orderBy(desc(subscribers.subscribedAt))
  }),
} satisfies TRPCRouterRecord
