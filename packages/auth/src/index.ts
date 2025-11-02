// src/auth.ts

import { db } from "@dsqr-dotdev/db/client"
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP, jwt, oAuthProxy } from "better-auth/plugins"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Initializes a Better Auth instance with Drizzle adapter,
 * JWT, Email OTP, and OAuth proxy plugins.
 *
 * This function returns a configured Better Auth instance that
 * can be reused by both your app and the CLI schema generator.
 */
export function initAuth(options: {
  baseUrl: string
  //productionUrl: string;
  secret: string | undefined
  extraPlugins?: BetterAuthPlugin[]
}): ReturnType<typeof betterAuth> {
  const config: BetterAuthOptions = {
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: options.baseUrl,
    secret: options.secret,

    plugins: [
      jwt(),

      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          try {
            await resend.emails.send({
              from: "DSQR <noreply@updates.dsqr.dev>",
              to: email,
              subject: `Your OTP: ${otp}`,
              html: `<p>Your code is: <strong>${otp}</strong></p>`,
            })
            console.log(`✉️ [AUTH] ${type} OTP sent to ${email}`)
            console.log("BONG", process.env.RESEND_API_KEY)
          } catch (error) {
            console.error(`❌ Failed to send ${type} OTP:`, error)
            throw error
          }
        },
      }),

      /*oAuthProxy({
        productionURL: options.productionUrl,
      }),*/

      ...(options.extraPlugins ?? []),
    ],

    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx)
      },
    },
  }

  return betterAuth(config)
}

/**
 * These exports are kept internal-safe to avoid leaking
 * unnameable plugin types in your generated .d.ts files.
 */
type InternalAuth = ReturnType<typeof betterAuth>
export type Auth = InternalAuth
export type Session = InternalAuth["$Infer"]["Session"]
