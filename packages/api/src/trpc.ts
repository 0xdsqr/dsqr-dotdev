import { initTRPC } from "@trpc/server"
import superjson from "superjson"

const t = initTRPC.create({
  transformer: superjson,
})

const router = t.router
const publicProcedure = t.procedure

export { router, publicProcedure}
