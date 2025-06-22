import { createRootRoute, Outlet } from '@tanstack/react-router'

function RootLayout() {
  return (
<main >
<Outlet />
          </main>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
