import { traceApiRequest } from "@dsqr-dotdev/api/runtime"
import { createFileRoute } from "@tanstack/react-router"
import { auth } from "../../auth/server"

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) =>
        traceApiRequest("http.auth.request", request, () => auth.handler(request)),
      POST: ({ request }) =>
        traceApiRequest("http.auth.request", request, () => auth.handler(request)),
    },
  },
})
