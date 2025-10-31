import { createSubscriberSchema, subscribers } from "@dsqr-dotdev/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"
import { z } from "zod/v4"

import { publicProcedure } from "../trpc.js"

export const emailRouter = {
  subscribe: publicProcedure
    .input(createSubscriberSchema)
    .mutation(({ ctx, input }) => {
      console.log("[EMAIL] Subscribing email:", input.email)
      return ctx.db.insert(subscribers).values(input).returning()
    }),
} satisfies TRPCRouterRecord
