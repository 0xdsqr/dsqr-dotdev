import { serve } from "@hono/node-server"
import { Hono } from "hono"
import healthRouter from "./routes/health.js"

const app = new Hono()

// Health routes
app.basePath("/health").route("/", healthRouter)

serve({ fetch: app.fetch, port: 3001 })
console.log("✅ Server running on http://localhost:3001")
