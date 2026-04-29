import { appRouter, createTRPCContext } from "@dsqr-dotdev/api"
import { traceApiRequest } from "@dsqr-dotdev/api/runtime"
import { createFileRoute } from "@tanstack/react-router"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { auth } from "../../auth/server"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth,
        headers: req.headers,
      }),
    onError() {},
  })

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: ({ request }) => traceApiRequest("http.trpc.request", request, () => handler(request)),
      POST: ({ request }) => traceApiRequest("http.trpc.request", request, () => handler(request)),
    },
  },
})
