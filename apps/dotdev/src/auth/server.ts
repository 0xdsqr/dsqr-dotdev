import { initAuth } from "@dsqr-dotdev/auth"
import { reactStartCookies } from "better-auth/react-start"

const baseUrl = process.env.BASE_URL || "http://localhost:3000"

export const auth = initAuth({
  baseUrl,
  secret: process.env.AUTH_SECRET,
  extraPlugins: [reactStartCookies()],
})
