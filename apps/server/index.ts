import { Elysia } from "elysia"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { appRouter, createTRPCContext } from "@dsqr-dotdev/api"

new Elysia()
  .all("/api/v1/trpc/*", async (opts) => {
    const res = await fetchRequestHandler({
      endpoint: "/api/v1/trpc",
      router: appRouter,
      req: opts.request,
      createContext: ({ req }) =>
        createTRPCContext({
          headers: req.headers,
        }),
    })
    return res
  })
  .listen(3001)

console.log(
  `🦊 Elysia tRPC server is running at http://localhost:3001/api/v1/trpc`,
)
