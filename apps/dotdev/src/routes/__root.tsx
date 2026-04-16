import type { AppRouter } from "@dsqr-dotdev/core/api"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { lazy, Suspense } from "react"
import { Footer } from "../components/footer"
import { Nav } from "../components/nav"
import { ThemeProvider } from "../components/theme-provider"

import appCss from "../styles.css?url"

// Lazy load devtools only in development
const TanStackDevtools = lazy(() =>
  import("@tanstack/react-devtools").then((mod) => ({
    default: mod.TanStackDevtools,
  })),
)
const TanStackRouterDevtoolsPanel = lazy(() =>
  import("@tanstack/react-router-devtools").then((mod) => ({
    default: mod.TanStackRouterDevtoolsPanel,
  })),
)

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<AppRouter>
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "dsqr",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <main className="py-24 text-center">
      <p className="text-xs font-mono uppercase tracking-[0.35em] text-muted-foreground">404</p>
      <h1 className="mt-4 text-3xl font-bold font-mono">not found</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">that page does not exist here.</p>
    </main>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="dsqr-theme">
          <Nav />
          <main className="container max-w-4xl mx-auto px-4 py-12">{children}</main>
          <Footer />
          {import.meta.env.DEV && import.meta.env.VITE_SHOW_DEVTOOLS === "true" && (
            <Suspense fallback={null}>
              <TanStackDevtools
                config={{
                  position: "bottom-left",
                }}
                plugins={[
                  {
                    name: "Tanstack Router",
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                ]}
              />
            </Suspense>
          )}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
