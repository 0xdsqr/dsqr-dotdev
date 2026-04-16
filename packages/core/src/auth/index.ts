import { database } from "@dsqr-dotdev/database/client"
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, emailOTP, jwt, organization } from "better-auth/plugins"
import { Resend } from "resend"
import { logger } from "../api/lib/logger"

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

    logger.debug("Initializing Resend client for auth email delivery", {
      hasApiKey: Boolean(apiKey),
      apiKeyPrefix: apiKey.slice(0, 4),
    })
    resend = new Resend(apiKey)
  }
  return resend
}

export function initAuth(options: {
  baseUrl: string
  secret: string | undefined
  extraPlugins?: BetterAuthPlugin[]
  trustedOrigins?: string[]
}): ReturnType<typeof betterAuth> {
  const config: BetterAuthOptions = {
    database: drizzleAdapter(database, { provider: "pg" }),
    baseURL: options.baseUrl,
    secret: options.secret,

    trustedOrigins: options.trustedOrigins ?? ["http://localhost:3001", "https://admin.dsqr.dev"],

    emailAndPassword: {
      enabled: true,
    },

    plugins: [
      jwt(),
      admin(),
      organization(),
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          const client = getResend()
          logger.info("Sending auth OTP email", {
            email: maskEmail(email),
            from: "noreply@updates.dsqr.dev",
          })

          const result = await client.emails.send({
            from: "DSQR <noreply@updates.dsqr.dev>",
            to: email,
            subject: `Your OTP: ${otp}`,
            html: `<p>Your code is: <strong>${otp}</strong></p>`,
          })

          if (result.error) {
            logger.error("Auth OTP email send failed", {
              email: maskEmail(email),
              error: result.error.message ?? "Unknown Resend error",
              statusCode: "statusCode" in result.error ? result.error.statusCode : undefined,
              name: result.error.name,
            })
            throw new Error(result.error.message ?? "Failed to send OTP email")
          }

          logger.info("Auth OTP email sent", {
            email: maskEmail(email),
            emailId: result.data?.id ?? null,
          })
        },
      }),

      ...(options.extraPlugins ?? []),
    ],
  }

  return betterAuth(config)
}

type InternalAuth = ReturnType<typeof betterAuth>
export type Auth = InternalAuth
export type Session = InternalAuth["$Infer"]["Session"]
