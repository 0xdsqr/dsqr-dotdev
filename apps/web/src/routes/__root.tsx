import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Providers } from '@/components/providers.js'
import { Footer } from '@/components/footer.js'
import { SocialLinks } from '@/components/social-links.js'

function RootLayout() {
  return (
    <Providers>
      <div className="font-mono antialiased min-h-screen flex flex-col">
        <main className="max-w-2xl mx-auto px-4 pt-16 pb-8 flex-1">
          <SocialLinks />
          <div className="mt-6">
            <Outlet />
          </div>
        </main>
        <Footer />
        {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
      </div>
    </Providers>
  )
}

const Route = createRootRoute({
  component: RootLayout,
})

export { Route }
