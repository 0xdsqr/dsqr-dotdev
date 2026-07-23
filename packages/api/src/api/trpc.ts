import { database } from "@dsqr-dotdev/database/client"
import { initTRPC, TRPCError } from "@trpc/server"
import { Duration } from "effect"
import superjson from "superjson"
import { ZodError, z } from "zod/v4"
import type { Auth } from "../auth"
import { getAuthoritativeAccessFailure } from "../auth/user-status"
import { Effect, runApiEffect } from "../runtime"
import { logger } from "./lib/logger"

export const createTRPCContext = async (opts: { headers: Headers; auth: Auth }) => {
  const authApi = opts.auth.api
  const session = await authApi.getSession({
    headers: opts.headers,
  })
  return {
    authApi,
    session,
    database,
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

  const result = await runApiEffect(
    Effect.gen(function* () {
      if (t._config.isDev) {
        const waitMs = Math.floor(Math.random() * 400) + 100
        yield* Effect.sleep(Duration.millis(waitMs))
      }

      return yield* Effect.tryPromise({
        try: () => next(),
        catch: (cause) => cause,
      })
    }).pipe(
      Effect.withSpan("trpc.procedure", {
        attributes: {
          "trpc.path": path,
          "trpc.authenticated": ctx.session?.user ? "true" : "false",
        },
      }),
    ),
  )

  const duration = Date.now() - start
  const userId = ctx.session?.user?.id

  if (result.ok) {
    logger.trpc(path, duration, userId)
  } else {
    logger.error("trpc.error", {
      procedure: path,
      duration,
      userId,
      code: result.error.code,
      message: result.error.message,
    })
  }

  return result
})

export const publicProcedure = t.procedure.use(timingMiddleware)

type SessionUser = {
  id?: string | null
  email?: string | null
  emailVerified?: boolean | null
  role?: string | string[] | null
  banned?: boolean | null
  banExpires?: Date | null
}

export function authorizeAuthoritativeUser<CurrentUser extends SessionUser>(
  currentUser: CurrentUser | null | undefined,
  requiredRole: "user" | "admin",
): CurrentUser {
  const failure = getAuthoritativeAccessFailure(currentUser, requiredRole)

  switch (failure) {
    case "missing-user":
      throw new TRPCError({ code: "UNAUTHORIZED" })
    case "unverified-email":
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "A verified email address is required.",
      })
    case "active-ban":
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This account has been suspended.",
      })
    case "insufficient-role":
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      })
  }

  return currentUser!
}

async function getAuthoritativeUser(databaseClient: typeof database, userId: string) {
  return (
    (await databaseClient.query.user.findFirst({
      where: (fields, operators) => operators.eq(fields.id, userId),
    })) ?? null
  )
}

export const protectedProcedure = t.procedure.use(timingMiddleware).use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  const currentUser = authorizeAuthoritativeUser(
    await getAuthoritativeUser(ctx.database, ctx.session.user.id),
    "user",
  )

  return next({
    ctx: {
      session: { ...ctx.session, user: { ...ctx.session.user, ...currentUser } },
    },
  })
})

export const adminProcedure = t.procedure.use(timingMiddleware).use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  const currentUser = authorizeAuthoritativeUser(
    await getAuthoritativeUser(ctx.database, ctx.session.user.id),
    "admin",
  )

  return next({
    ctx: {
      session: { ...ctx.session, user: { ...ctx.session.user, ...currentUser } },
    },
  })
})
