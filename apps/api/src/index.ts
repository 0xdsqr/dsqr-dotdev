import { Elysia } from "elysia"
import { healthRoutes } from "./routes/health.routes.js"

export const app = new Elysia().use(healthRoutes)

if (import.meta.path === Bun.main) {
  app.listen(3001)
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  )
}
