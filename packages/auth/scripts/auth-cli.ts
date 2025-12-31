import { initAuth } from "../src/index"

// This is only used for CLI schema generation, not runtime
export const auth = initAuth({
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  secret: process.env.AUTH_SECRET || "cli-secret",
})
