import { authRouter } from "./router/auth"
import { emailRouter } from "./router/email"
import { miscRouter } from "./router/misc"
import { postRouter } from "./router/post"
import { createTRPCRouter } from "./trpc"

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  email: emailRouter,
  misc: miscRouter,
})

export type AppRouter = typeof appRouter
