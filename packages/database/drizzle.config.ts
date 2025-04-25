import type { Config } from "drizzle-kit"
import "dotenv/config"

if (!process.env.DATABASE_URL) {
  throw new Error(
    "database url is rerquied pelease set DATABASE_URL as your connection string",
  )
}
export default {
  schema: "./src/schema.ts",
  out: "./data-migration",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
} satisfies Config
