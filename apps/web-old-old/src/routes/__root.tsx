import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Providers } from '@/components/providers'
import { Footer } from '@/components/footer'
import { SocialLinks } from '@/components/social-links'

function RootLayout() {
  return (
    <Providers>
      <div className="font-mono antialiased">
        <div className="flex flex-col">
          <main className="max-w-2xl mx-auto px-4 pt-16 pb-8">
            <SocialLinks />
            <div className="mt-6">
              <Outlet />
            </div>
          </main>
          <Footer />
          {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
        </div>
      </div>
    </Providers>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
