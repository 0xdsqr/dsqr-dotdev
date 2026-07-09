import type { Config } from "drizzle-kit"
import "dotenv/config"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required; set it to your database connection string")
}
export default {
  schema: "./src/schema.ts",
  out: "./data-migration",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
} satisfies Config
