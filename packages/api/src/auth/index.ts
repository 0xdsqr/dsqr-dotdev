import { database } from "@dsqr-dotdev/database/client"
import { user } from "@dsqr-dotdev/database/schema"
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { admin, emailOTP } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import { logger } from "../api/lib/logger"
import { hasActiveBan, hasExpiredBan } from "./user-status"

export { getAuthoritativeAccessFailure } from "./user-status"

// Lazy initialization of Resend - only created when needed
let resend: Resend | null = null

function maskEmail(email: string): string {
  const [local, domain = ""] = email.split("@")
  if (!local) {
    return email
  }

  const visibleLocal = local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`
  return `${visibleLocal}@${domain}`
}

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      logger.error("Auth OTP email send blocked: missing RESEND_API_KEY")
      throw new Error("RESEND_API_KEY environment variable is required")
    }

    logger.info("Initializing Resend client for auth email delivery")
    resend = new Resend(apiKey)
  }
  return resend
}

export const AUTH_COOKIE_PREFIXES = {
  public: "dsqr-public-auth",
  admin: "dsqr-studio-auth",
} as const

export function createAuthSurfacePlugins(surface: "public" | "admin"): BetterAuthPlugin[] {
  return surface === "admin" ? [admin()] : []
}

type AuthOptions = {
  baseUrl: string
  secret: string | undefined
  surface: "public" | "admin"
  extraPlugins?: BetterAuthPlugin[]
  trustedProxies?: string[]
  trustedOrigins?: string[]
}

export function createAuthOptions(options: AuthOptions): BetterAuthOptions {
  const trustedProxies =
    options.trustedProxies ??
    process.env.AUTH_TRUSTED_PROXIES?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ??
    []

  return {
    database: drizzleAdapter(database, { provider: "pg" }),
    baseURL: options.baseUrl,
    secret: options.secret,

    trustedOrigins: options.trustedOrigins ?? [options.baseUrl],

    // Throttle auth endpoints (OTP requests, sign-in attempts) to blunt
    // brute-force and email-bombing. Disabled in dev to avoid local friction.
    rateLimit: {
      enabled: process.env.NODE_ENV !== "development",
      window: 60,
      max: 20,
    },

    advanced: {
      cookiePrefix: AUTH_COOKIE_PREFIXES[options.surface],
      ...(trustedProxies.length > 0
        ? {
            ipAddress: {
              trustedProxies,
            },
          }
        : {}),
    },

    databaseHooks: {
      session: {
        create: {
          async before(session) {
            const currentUser =
              (await database.query.user.findFirst({
                where: (fields, operators) => operators.eq(fields.id, session.userId),
              })) ?? null

            if (!currentUser) {
              throw APIError.from("FORBIDDEN", {
                code: "ACCOUNT_UNAVAILABLE",
                message: "This account is unavailable.",
              })
            }

            if (hasActiveBan(currentUser)) {
              throw APIError.from("FORBIDDEN", {
                code: "BANNED_USER",
                message: "This account has been suspended.",
              })
            }

            if (hasExpiredBan(currentUser)) {
              await database
                .update(user)
                .set({
                  banned: false,
                  banReason: null,
                  banExpires: null,
                })
                .where(eq(user.id, currentUser.id))
            }
          },
        },
      },
    },

    plugins: [
      ...createAuthSurfacePlugins(options.surface),
      emailOTP({
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp }) {
          const client = getResend()
          logger.info("Auth OTP requested", {
            email: maskEmail(email),
            otpLength: otp.length,
          })

          logger.info("Sending auth OTP email", {
            email: maskEmail(email),
            from: "noreply@updates.dsqr.dev",
            subject: "Your DSQR sign-in code",
          })

          let result: Awaited<ReturnType<typeof client.emails.send>>
          try {
            // Keep the one-time code out of the subject line so it never leaks via
            // notification previews, mail-client logs, or shoulder-surfing.
            result = await client.emails.send({
              from: "DSQR <noreply@updates.dsqr.dev>",
              to: email,
              subject: "Your DSQR sign-in code",
              html: `<p>Your code is: <strong>${otp}</strong></p>`,
              text: `Your code is: ${otp}`,
            })
          } catch (error) {
            logger.error("Auth OTP email send threw before response", {
              email: maskEmail(email),
              error: error instanceof Error ? error.message : String(error),
            })
            throw error
          }

          if (result.error) {
            const statusCode =
              "statusCode" in result.error ? String(result.error.statusCode ?? "") : ""
            const errorName = result.error.name ?? ""
            const errorMessage = result.error.message ?? "Failed to send OTP email"

            logger.error("Auth OTP email send failed", {
              email: maskEmail(email),
              error: errorMessage,
              statusCode: statusCode || undefined,
              name: errorName || undefined,
            })

            throw new Error([statusCode, errorName, errorMessage].filter(Boolean).join(" ").trim())
          }

          logger.info("Auth OTP email sent", {
            email: maskEmail(email),
          })
        },
      }),

      ...(options.extraPlugins ?? []),
    ],
  }
}

export function initAuth(options: AuthOptions): ReturnType<typeof betterAuth> {
  logger.info("Initializing auth configuration", {
    baseUrl: options.baseUrl,
    hasAuthSecret: Boolean(options.secret),
    trustedOrigins: options.trustedOrigins ?? [options.baseUrl],
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    surface: options.surface,
  })

  return betterAuth(createAuthOptions(options))
}

type InternalAuth = ReturnType<typeof betterAuth>
export type Auth = InternalAuth
export type Session = InternalAuth["$Infer"]["Session"]
