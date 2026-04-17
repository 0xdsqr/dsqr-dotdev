import { user } from "@dsqr-dotdev/database/auth-schema"
import { database } from "@dsqr-dotdev/database/client"
import { eq } from "drizzle-orm"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "../auth/server"

export type SessionUser = {
  id?: string | null
  email?: string | null
  name?: string | null
  role?: string | string[] | null
}

function normalizeRole(role: string | string[] | null | undefined) {
  if (Array.isArray(role)) {
    return role[0]?.trim()?.toLowerCase() ?? null
  }

  return role?.trim()?.toLowerCase() ?? null
}

export function isAdminUser(currentUser: SessionUser | null | undefined) {
  return normalizeRole(currentUser?.role) === "admin"
}

async function lookupAdminUser(currentUser: SessionUser | null | undefined) {
  if (!currentUser) {
    return null
  }

  if (isAdminUser(currentUser)) {
    return currentUser
  }

  if (currentUser.id) {
    const dbUser =
      (await database.query.user.findFirst({
        where: (fields, operators) => operators.eq(fields.id, currentUser.id!),
      })) ?? null

    return isAdminUser(dbUser) ? dbUser : null
  }

  if (currentUser.email) {
    const [dbUser] = await database
      .select()
      .from(user)
      .where(eq(user.email, currentUser.email))
      .limit(1)

    return isAdminUser(dbUser) ? dbUser : null
  }

  return null
}

export const getAdminSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })

  return lookupAdminUser(session?.user)
})
