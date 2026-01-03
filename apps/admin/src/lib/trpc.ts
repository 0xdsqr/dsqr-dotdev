import type { AppRouter } from "@dsqr-dotdev/api"
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import SuperJSON from "superjson"

function getBaseUrl() {
  // Use local tRPC API (same app)
  if (typeof window !== "undefined") {
    return ""
  }
  return process.env.BASE_URL || "http://localhost:3001"
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchLink({
      transformer: SuperJSON,
      url: `${getBaseUrl()}/api/trpc`,
      headers() {
        const headers = new Headers()
        headers.set("x-trpc-source", "dsqr-admin")
        return headers
      },
    }),
  ],
})

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>()
