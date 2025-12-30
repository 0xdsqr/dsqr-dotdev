import type { Auth } from "@dsqr-dotdev/auth"
import { db } from "@dsqr-dotdev/db/client"
import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { ZodError, z } from "zod/v4"
import { logger } from "./lib/logger"

export const createTRPCContext = async (opts: {
  headers: Headers
  auth: Auth
}) => {
  const authApi = opts.auth.api
  const session = await authApi.getSession({
    headers: opts.headers,
  })
  return {
    authApi,
    session,
    db,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      logger.error("Internal server error", {
        code: error.code,
        message: error.message,
      })
    }
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
            : null,
      },
    }
  },
})

export const createTRPCRouter = t.router

const timingMiddleware = t.middleware(async ({ next, path, ctx }) => {
  const start = Date.now()

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  const result = await next()

  const duration = Date.now() - start
  const userId = ctx.session?.user?.id

  if (result.ok) {
    logger.trpc(path, duration, userId)
  } else {
    logger.error(`[TRPC] ${path}`, {
      duration,
      userId,
      code: result.error.code,
      message: result.error.message,
    })
  }

  return result
})

export const publicProcedure = t.procedure.use(timingMiddleware)

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })
