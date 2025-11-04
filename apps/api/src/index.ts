import { serve } from "@hono/node-server"
import { Hono } from "hono"
import healthRouter from "./routes/health.js"

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`)

const app = new Hono()

app.basePath("/health").route("/", healthRouter)

const port = 3001
serve({ fetch: app.fetch, port })
log(`✅ Server listening on http://localhost:${port}`)
