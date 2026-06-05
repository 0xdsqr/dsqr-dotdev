import { appRouter, createTRPCContext } from "@dsqr-dotdev/api"
import { traceApiRequest } from "@dsqr-dotdev/api/runtime"
import { createFileRoute } from "@tanstack/react-router"
import { TRPCError } from "@trpc/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

import { auth } from "../../auth/server"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth: auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      // Expected tRPC errors are already surfaced to the client and logged by the
      // timing middleware; only flag unexpected non-tRPC failures here.
      if (!(error instanceof TRPCError)) {
        console.error(`[trpc] unhandled error on ${path ?? "<no-path>"}:`, error)
      }
    },
  })

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: ({ request }) => traceApiRequest("http.trpc.request", request, () => handler(request)),
      POST: ({ request }) => traceApiRequest("http.trpc.request", request, () => handler(request)),
    },
  },
})
