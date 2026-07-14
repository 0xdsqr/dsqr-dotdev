import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server"
import { adminAuthRouter } from "./router/auth"
import { adminEmailRouter } from "./router/email"
import { adminPostRouter } from "./router/post"
import { createTRPCRouter } from "./trpc"

export const adminAppRouter = createTRPCRouter({
  auth: adminAuthRouter,
  post: adminPostRouter,
  email: adminEmailRouter,
})

export type AdminAppRouter = typeof adminAppRouter
export type AdminRouterInputs = inferRouterInputs<AdminAppRouter>
export type AdminRouterOutputs = inferRouterOutputs<AdminAppRouter>

export { createTRPCContext } from "./trpc"
