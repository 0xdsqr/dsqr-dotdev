import { authRouter } from "./router/auth.js"
import { emailRouter } from "./router/email.js"
import { postRouter } from "./router/post.js"
import { createTRPCRouter } from "./trpc.js"

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  email: emailRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
