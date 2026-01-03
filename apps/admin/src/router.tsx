import { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import SuperJSON from "superjson"
import { TRPCProvider, trpcClient } from "./lib/trpc"

import { routeTree } from "./routeTree.gen"

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: SuperJSON.serialize },
      hydrate: { deserializeData: SuperJSON.deserialize },
    },
  })
  const trpc = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  })

  const router = createRouter({
    routeTree,
    context: { queryClient, trpc },
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    Wrap: (props) => (
      <TRPCProvider
        trpcClient={trpcClient}
        queryClient={queryClient}
        {...props}
      />
    ),
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}
