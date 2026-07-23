import { database } from "@dsqr-dotdev/database/client"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "../auth/server"
import { resolveAuthoritativeStudioAdmin } from "./admin-authorization"

export const getAdminSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })

  return resolveAuthoritativeStudioAdmin(session?.user, async (userId) => {
    return (
      (await database.query.user.findFirst({
        where: (fields, operators) => operators.eq(fields.id, userId),
      })) ?? null
    )
  })
})
