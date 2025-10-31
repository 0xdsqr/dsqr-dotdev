import { initAuth } from "@dsqr-dotdev/auth"
import { reactStartCookies } from "better-auth/react-start"

export const auth = initAuth({
  baseUrl: "http://localhost:3000",
  secret: process.env.AUTH_SECRET,
  extraPlugins: [reactStartCookies()],
})
