import type { AppRouter } from "@dsqr-dotdev/core/api"
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import SuperJSON from "superjson"
import { getInternalApiBaseUrl } from "./runtime-url"

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return ""
  }

  return getInternalApiBaseUrl()
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
        return {
          "x-trpc-source": "dsqr-studio-react",
        }
      },
    }),
  ],
})

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>()
