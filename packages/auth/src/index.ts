// src/auth.ts

import { db } from "@dsqr-dotdev/db/client"
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP, jwt, oAuthProxy } from "better-auth/plugins"

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
          const label =
            type === "sign-in"
              ? "Sign-in"
              : type === "email-verification"
                ? "Verification"
                : "Password reset"
          console.log(`${label} OTP:`, otp, "→", email)
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
