import { initAuth } from "@dsqr-dotdev/core/auth"
import { reactStartCookies } from "better-auth/react-start"
import { getPublicBaseUrl, getTrustedOrigins } from "../lib/runtime-url"

export const auth = initAuth({
  baseUrl: getPublicBaseUrl(),
  secret: process.env.AUTH_SECRET,
  extraPlugins: [reactStartCookies()],
  trustedOrigins: getTrustedOrigins(),
})
