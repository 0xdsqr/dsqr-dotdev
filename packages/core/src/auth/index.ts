import { db } from "@dsqr-dotdev/db/client"
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, emailOTP, jwt, organization } from "better-auth/plugins"
import { Resend } from "resend"

// Lazy initialization of Resend - only created when needed
let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required")
    }
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
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: options.baseUrl,
    secret: options.secret,

    // Allow cross-origin requests from admin panel
    trustedOrigins: options.trustedOrigins ?? [
      "http://localhost:3001", // admin dev
      "https://admin.dsqr.dev", // admin prod
    ],

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
          await client.emails.send({
            from: "DSQR <noreply@updates.dsqr.dev>",
            to: email,
            subject: `Your OTP: ${otp}`,
            html: `<p>Your code is: <strong>${otp}</strong></p>`,
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
