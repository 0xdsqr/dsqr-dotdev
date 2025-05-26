import { Elysia, t } from "elysia"
import { subscriberControllers } from "../controllers/subscribers.controllers.js"
import { ResponseSchema } from "../types/response.types.js"

const handleError = (error: unknown) => ({
  errors: [
    {
      status: "500",
      title: "Internal Server Error",
      detail: error instanceof Error ? error.message : "Unknown error occurred",
    },
  ],
})

export const subscriberRoutes = new Elysia({ prefix: "/v1/subscriber" })
  .onTransform(({ body, params, path, request: { method } }) => {
    console.log(`${method} ${path}`, { body, params })
  })
  .get(
    "/",
    async ({ set }) => {
      try {
        const result = await subscriberControllers.getAllSubscribers()
        return result
      } catch (error) {
        set.status = 500
        return handleError(error)
      }
    },
    {
      response: ResponseSchema,
    },
  )
  .get(
    "/:email",
    async ({ params: { email }, set }) => {
      try {
        const result = await subscriberControllers.getSubscriberByEmail(email)
        set.status = result.status
        return result.body
      } catch (error) {
        set.status = 500
        return handleError(error)
      }
    },
    {
      params: t.Object({
        email: t.String(),
      }),
      response: ResponseSchema,
    },
  )
  .post(
    "/",
    async ({ body: { email }, set }) => {
      try {
        const result = await subscriberControllers.createSubscriber(email)
        set.status = result.status
        return result.body
      } catch (error) {
        set.status = 500
        return handleError(error)
      }
    },
    {
      body: t.Object({
        email: t.String(),
      }),
      response: ResponseSchema,
    },
  )
