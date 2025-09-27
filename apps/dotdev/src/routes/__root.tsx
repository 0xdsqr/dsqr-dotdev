import { TanstackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import { Footer } from "@/components/footer"
import { NavSocials } from "@/components/nav-socials"
import { ThemeProvider } from "@/components/theme-provider"

const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="system" storageKey="dsqr-theme">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-4 pt-10">
          <NavSocials />
          <Outlet />
          <Footer />
        </div>
      </div>
      <TanstackDevtools
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
    </ThemeProvider>
  ),
})

export { Route }
