import type { AppRouter } from "@dsqr-dotdev/api"
import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { authClient } from "../auth/client"
import { AppSidebar } from "../components/app-sidebar"
import { ThemeProvider } from "../components/theme-provider"
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar"

import appCss from "../styles.css?url"

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
        title: "dsqr admin",
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
  component: RootComponent,
})

function RootComponent() {
  const { data: session, isPending } = authClient.useSession()

  // Loading state
  if (isPending) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="font-sans antialiased">
          <div className="min-h-screen flex items-center justify-center bg-background">
            <p className="text-muted-foreground font-mono">loading...</p>
          </div>
          <Scripts />
        </body>
      </html>
    )
  }

  // Not logged in or not admin - role comes from better-auth admin plugin
  const userRole = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || userRole !== "admin") {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="font-sans antialiased">
          <ThemeProvider defaultTheme="system" storageKey="dsqr-admin-theme">
            <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background px-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-600 shadow-lg shadow-purple-600/20">
                <span className="text-3xl font-bold text-white font-mono">
                  A
                </span>
              </div>
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-semibold font-mono text-foreground">
                  access denied
                </h1>
                <p className="text-muted-foreground font-mono text-lg">
                  carry on...
                </p>
              </div>
              <a
                href="https://dsqr.dev/"
                className="text-sm font-mono text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline decoration-dotted underline-offset-4 transition-colors"
              >
                back to main site
              </a>
            </div>
          </ThemeProvider>
          <Scripts />
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="dsqr-admin-theme">
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Outlet />
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
