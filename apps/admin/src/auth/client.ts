import { adminClient, emailOTPClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

// Auth is handled locally on this app - same DB, same session
export const authClient = createAuthClient({
  plugins: [adminClient(), emailOTPClient()],
})
