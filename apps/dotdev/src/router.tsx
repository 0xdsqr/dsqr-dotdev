import { createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { createApiContext } from '@dsqr-dotdev/api/client'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const context = createApiContext()

  return createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    Wrap: ({ children }) => (
      <QueryClientProvider client={context.queryClient}>{children}</QueryClientProvider>
    ),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
