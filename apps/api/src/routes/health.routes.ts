import { Elysia } from "elysia"
import { ResponseSchema } from "../types/response.types.js"
import { healthControllers } from "../controllers/health.controllers.js"

export const healthRoutes = new Elysia({ prefix: "/v1/health" })
  .onTransform(({ path, request: { method } }) => {
    console.log(`${method} ${path}`)
  })
  .get("/liveness", async ({ set }) => {
    try {
      const result = await healthControllers.checkLiveness()
      set.status = result.status
      return result.body
    } catch (error) {
      set.status = 500
      return {
        errors: [
          {
            status: "500",
            title: "Internal Server Error",
            detail: error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      }
    }
  })
  .get("/readiness", async ({ set }) => {
    try {
      const result = await healthControllers.checkReadiness()
      set.status = result.status
      return result.body
    } catch (error) {
      set.status = 500
      return {
        errors: [
          {
            status: "500",
            title: "Internal Server Error",
            detail: error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      }
    }
  }, {
    response: {
      200: ResponseSchema,
      500: ResponseSchema,
      503: ResponseSchema
    }
  })