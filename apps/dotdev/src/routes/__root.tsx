import type { AppRouter } from "@dsqr-dotdev/api"
import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router"
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
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
    ],
  }),
  shellComponent: RootDocument,
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
          <main className="container max-w-4xl mx-auto px-4 py-12">
            {children}
          </main>
          <Footer />
          {import.meta.env.DEV &&
            import.meta.env.VITE_SHOW_DEVTOOLS === "true" && (
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
