import { authRouter } from "./router/auth.js"
import { emailRouter } from "./router/email.js"
import { miscRouter } from "./router/misc.js"
import { postRouter } from "./router/post.js"
import { createTRPCRouter } from "./trpc.js"

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  email: emailRouter,
  misc: miscRouter,
})

export type AppRouter = typeof appRouter
