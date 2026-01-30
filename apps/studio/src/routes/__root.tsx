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
import { SidebarInset, SidebarProvider } from "@dsqr-dotdev/ui/components/sidebar"

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
  component: RootComponent,
})

function RootComponent() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="font-sans antialiased">
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground font-mono">
                loading studio...
              </p>
            </div>
          </div>
          <Scripts />
        </body>
      </html>
    )
  }

  const userRole = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || userRole !== "admin") {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="font-sans antialiased">
          <ThemeProvider defaultTheme="system" storageKey="dsqr-studio-theme">
            <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <span className="text-2xl font-bold text-primary-foreground font-mono">
                  S
                </span>
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  access denied
                </h1>
                <p className="text-muted-foreground text-sm">
                  you need admin access to enter the studio
                </p>
              </div>
              <a
                href="https://dsqr.dev/"
                className="text-sm text-primary hover:text-primary/80 underline decoration-dotted underline-offset-4 transition-colors"
              >
                back to dsqr.dev
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
        <ThemeProvider defaultTheme="system" storageKey="dsqr-studio-theme">
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
