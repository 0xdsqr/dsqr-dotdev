import { z } from "zod/v4"
import { publicProcedure } from "../trpc.js"

import type { TRPCRouterRecord } from "@trpc/server"

interface EmailSubscription {
  id: string
  email: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const mockEmails: EmailSubscription[] = []

const emailRouter = {
  create: publicProcedure
    .input(z.object({ email: z.email() }))
    .mutation(({ input }) => {
      console.log("Newsletter signup email:", input.email)

      const now = new Date()
      const newEmail: EmailSubscription = {
        id: crypto.randomUUID(),
        email: input.email,
        active: true,
        createdAt: now,
        updatedAt: now,
      }

      mockEmails.push(newEmail)

      return {
        success: true,
        message: "Successfully subscribed to newsletter!",
        email: newEmail,
      }
    }),

  all: publicProcedure.query(() => {
    return mockEmails.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }),
} satisfies TRPCRouterRecord

export { emailRouter }
export type { EmailSubscription }
