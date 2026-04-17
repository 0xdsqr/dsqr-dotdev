import { database } from "@dsqr-dotdev/database/client"
import { user } from "@dsqr-dotdev/database/auth-schema"
import { initTRPC, TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import superjson from "superjson"
import { ZodError, z } from "zod/v4"
import type { Auth } from "../auth"
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

export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

function normalizeRole(role: string | string[] | null | undefined) {
  if (Array.isArray(role)) {
    return role[0]?.trim()?.toLowerCase() ?? null
  }

  return role?.trim()?.toLowerCase() ?? null
}

type SessionUser = {
  id?: string | null
  email?: string | null
  role?: string | string[] | null
}

async function resolveAdminSessionUser(currentUser: SessionUser | null | undefined) {
  if (!currentUser) {
    return null
  }

  if (normalizeRole((currentUser as { role?: string | string[] | null }).role) === "admin") {
    return currentUser
  }

  if (currentUser.id) {
    const dbUser =
      (await database.query.user.findFirst({
        where: (fields, operators) => operators.eq(fields.id, currentUser.id!),
      })) ?? null

    if (normalizeRole(dbUser?.role) === "admin") {
      return dbUser
    }
  }

  if (currentUser.email) {
    const [dbUser] = await database
      .select()
      .from(user)
      .where(eq(user.email, currentUser.email))
      .limit(1)

    if (normalizeRole(dbUser?.role) === "admin") {
      return dbUser
    }
  }

  return null
}

export const adminProcedure = t.procedure.use(timingMiddleware).use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  const adminUser = await resolveAdminSessionUser(ctx.session.user)

  if (!adminUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: { ...ctx.session.user, role: "admin" } },
    },
  })
})
