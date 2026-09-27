import type { AppRouter } from './router.server'
import { QueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'

export function createApiContext() {
  const queryClient = new QueryClient()
  const client = createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: '/api/trpc' })],
  })

  return {
    queryClient,
    trpc: createTRPCOptionsProxy<AppRouter>({ client, queryClient }),
  }
}

export type ApiContext = ReturnType<typeof createApiContext>
