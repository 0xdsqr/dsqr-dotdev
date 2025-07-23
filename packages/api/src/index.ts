import { router } from "./trpc"
import { postRouter } from "./router/post"
import { emailRouter } from "./router/email"
import type { inferRouterOutputs } from "@trpc/server"

const appRouter = router({
  post: postRouter,
  email: emailRouter,
})

type AppRouter = typeof appRouter
type RouterOutputs = inferRouterOutputs<AppRouter>

export { appRouter }
export type { AppRouter, RouterOutputs }