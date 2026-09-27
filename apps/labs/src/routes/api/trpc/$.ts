import { appRouter } from '@dsqr-dotdev/api/server'
import { createFileRoute } from '@tanstack/react-router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

function handleRequest({ request }: { request: Request }) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => ({}),
  })
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: { GET: handleRequest },
  },
})
