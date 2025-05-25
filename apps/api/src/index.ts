import { Elysia } from "elysia"
import { subscriberRoutes } from "./routes/subscribers.routes.js"
import { healthRoutes } from "./routes/health.routes.js"

export const app = new Elysia()
  .use(subscriberRoutes)
  .use(healthRoutes)

if (import.meta.path === Bun.main) {
  app.listen(3008)
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  )
}
