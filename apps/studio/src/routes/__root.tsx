import type { AppRouter } from "@dsqr-dotdev/core/api"
import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { authClient } from "../auth/client"
import { ThemeProvider } from "../components/theme-provider"

import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<AppRouter>
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "dsqr studio" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
    ],
  }),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    const userRole = (session?.user as { role?: string } | undefined)?.role
    const isAuthed = !!session?.user && userRole === "admin"

    return { session, isAuthed }
  },
  shellComponent: RootShell,
})

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="dsqr-studio-theme">
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
