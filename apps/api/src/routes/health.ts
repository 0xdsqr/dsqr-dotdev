import { Hono } from "hono"

const healthRouter = new Hono()

healthRouter.get("/live", (c) => c.body(null, 204))
healthRouter.get("/ready", (c) => c.json({ status: "up" }))

export default healthRouter
