import { db } from "@dsqr-dotdev/db/client"
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, emailOTP, jwt, organization } from "better-auth/plugins"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export function initAuth(options: {
  baseUrl: string
  secret: string | undefined
  extraPlugins?: BetterAuthPlugin[]
}): ReturnType<typeof betterAuth> {
  const config: BetterAuthOptions = {
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: options.baseUrl,
    secret: options.secret,

    plugins: [
      jwt(),
      admin(),
      organization(),
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          await resend.emails.send({
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
