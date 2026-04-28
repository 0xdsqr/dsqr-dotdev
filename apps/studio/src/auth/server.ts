import { initAuth } from "@dsqr-dotdev/api/auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { getPublicBaseUrl, getTrustedOrigins } from "../lib/runtime-url"

export const auth = initAuth({
  baseUrl: getPublicBaseUrl(),
  secret: process.env.AUTH_SECRET,
  extraPlugins: [tanstackStartCookies()],
  trustedOrigins: getTrustedOrigins(),
})
