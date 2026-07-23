export type AuthoritativeUserStatus = {
  readonly banned?: boolean | null
  readonly banExpires?: Date | null
}

export type AuthoritativeAccessUser = AuthoritativeUserStatus & {
  readonly emailVerified?: boolean | null
  readonly role?: string | string[] | null
}

export type AuthoritativeAccessFailure =
  | "missing-user"
  | "unverified-email"
  | "active-ban"
  | "insufficient-role"

function normalizeRole(role: string | string[] | null | undefined): string | null {
  if (Array.isArray(role)) {
    return role[0]?.trim().toLowerCase() ?? null
  }

  return role?.trim().toLowerCase() ?? null
}

export function hasActiveBan(user: AuthoritativeUserStatus, now: Date = new Date()): boolean {
  if (user.banned !== true) {
    return false
  }

  return user.banExpires === null || user.banExpires === undefined || user.banExpires > now
}

export function hasExpiredBan(user: AuthoritativeUserStatus, now: Date = new Date()): boolean {
  return user.banned === true && user.banExpires instanceof Date && user.banExpires <= now
}

export function getAuthoritativeAccessFailure(
  user: AuthoritativeAccessUser | null | undefined,
  requiredRole: "user" | "admin",
): AuthoritativeAccessFailure | null {
  if (!user) {
    return "missing-user"
  }

  if (user.emailVerified !== true) {
    return "unverified-email"
  }

  if (hasActiveBan(user)) {
    return "active-ban"
  }

  if (requiredRole === "admin" && normalizeRole(user.role) !== "admin") {
    return "insufficient-role"
  }

  return null
}
