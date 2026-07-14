import { publicEmailRouter } from "./router/email"
import { miscRouter } from "./router/misc"
import { publicPostRouter } from "./router/post"
import { createTRPCRouter } from "./trpc"

export const publicAppRouter = createTRPCRouter({
  post: publicPostRouter,
  email: publicEmailRouter,
  misc: miscRouter,
})

export type PublicAppRouter = typeof publicAppRouter
