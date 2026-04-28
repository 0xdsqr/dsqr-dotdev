import type { AppRouter } from "@dsqr-dotdev/api"
import { ThemeProvider } from "@dsqr-dotdev/react/components/theme-provider"
import { Toaster } from "@dsqr-dotdev/react/components/ui/sonner"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<AppRouter>
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "dsqr / studio" },
      {
        name: "description",
        content: "Private admin workspace for managing dsqr.dev content.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: StudioNotFound,
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider defaultTheme="system" storageKey="dsqr-theme">
          <Outlet />
          <Toaster position="top-center" richColors />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  )
}

function StudioNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground">studio</p>
        <h1 className="mt-4 font-mono text-3xl font-semibold">page not found</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Head back to the studio home page and keep going from there.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-md border border-border px-4 py-2 font-mono text-sm transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          return to studio
        </a>
      </div>
    </main>
  )
}
