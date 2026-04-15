import { initAuth } from "@dsqr-dotdev/core/auth"
import { reactStartCookies } from "better-auth/react-start"

const baseUrl = process.env.BASE_URL || "http://localhost:3020"

export const auth = initAuth({
  baseUrl,
  secret: process.env.AUTH_SECRET,
  extraPlugins: [reactStartCookies()],
})
