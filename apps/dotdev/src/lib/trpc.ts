import type { AppRouter } from "@dsqr-dotdev/api"
import { createTRPCClient, httpBatchStreamLink, loggerLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import SuperJSON from "superjson"

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchStreamLink({
      transformer: SuperJSON,
      url: "http://localhost:3000" + "/api/trpc",
      headers() {
        const headers = new Headers()
        headers.set("x-trpc-source", "dsqr-dotdev-react")
        return headers
      },
    }),
  ],
})

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>()
