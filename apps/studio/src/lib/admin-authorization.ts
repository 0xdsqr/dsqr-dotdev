import { getAuthoritativeAccessFailure } from "@dsqr-dotdev/api/auth"

export type StudioSessionUser = {
  readonly id?: string | null
  readonly email?: string | null
  readonly role?: string | string[] | null
}

export type AuthoritativeStudioAdmin = {
  readonly id: string
  readonly emailVerified: boolean
  readonly role: string | string[] | null
  readonly banned?: boolean | null
  readonly banExpires?: Date | null
}

export async function resolveAuthoritativeStudioAdmin<CurrentUser extends AuthoritativeStudioAdmin>(
  sessionUser: StudioSessionUser | null | undefined,
  findUserById: (userId: string) => Promise<CurrentUser | null>,
): Promise<CurrentUser | null> {
  if (!sessionUser?.id) {
    return null
  }

  const currentUser = await findUserById(sessionUser.id)

  return getAuthoritativeAccessFailure(currentUser, "admin") === null ? currentUser : null
}

export function requireAuthoritativeStudioAdmin<CurrentUser extends AuthoritativeStudioAdmin>(
  currentUser: CurrentUser | null,
): CurrentUser {
  if (!currentUser) {
    throw new Error("UNAUTHORIZED")
  }

  return currentUser
}
