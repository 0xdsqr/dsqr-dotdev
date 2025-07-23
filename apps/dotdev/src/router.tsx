import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import superjson from "superjson"
import { routeTree } from "./routeTree.gen.js"
import { Spinner } from "@/components/spinner.js"

import type { AppRouter } from "@dsqr-dotdev/api"

const queryClient = new QueryClient()

const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      httpBatchLink({
        url: "/api/v1/trpc",
        transformer: superjson,
      }),
    ],
  }),
  queryClient,
})

function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    context: {
      trpc,
      queryClient,
    },
    defaultPendingComponent: () => (
      <div className="p-2 text-2xl">
        <Spinner />
      </div>
    ),
    Wrap: function WrapComponent({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    },
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}

export { createRouter, queryClient, trpc }
