import { ThemeProvider } from "@dsqr-dotdev/react/components/theme-provider"
import { ThemeToggle } from "@dsqr-dotdev/react/components/theme-toggle"
import { SiteSocialLinks } from "@dsqr-dotdev/react/components/site-social-links"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

const currentYear = new Date().getFullYear()

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="dsqr-labs-theme">
      <main className="min-h-dvh overflow-hidden bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_68%)]" />
        </div>

        <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>

          <section className="flex items-start justify-center pt-16 sm:pt-24 lg:pt-28">
            <div className="max-w-3xl text-center">
              <div className="mx-auto inline-flex flex-col items-center gap-3">
                <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                  DSQR Labs LLC
                </h1>
                <div className="h-px w-36 bg-gradient-to-r from-transparent via-primary/55 to-transparent" />
              </div>

              <div className="mx-auto mt-7 max-w-2xl text-pretty font-mono text-sm leading-8 text-muted-foreground sm:text-base">
                <p>
                  DSQR Labs LLC is a one-person consulting studio focused on{" "}
                  <span className="border-b-2 border-dotted border-primary/55 text-foreground">
                    systems, infrastructure, performance, and backend engineering
                  </span>
                  . The goal is simple: help people ship software that stays{" "}
                  <span className="border-b-2 border-dotted border-primary/55 text-foreground">
                    understandable, operable, and boring in the best way.
                  </span>{" "}
                  Want to work together?{" "}
                  <a
                    href="mailto:me@dsqr.dev"
                    className="whitespace-nowrap text-foreground underline decoration-dotted decoration-2 underline-offset-4 transition-colors hover:text-primary"
                  >
                    me@dsqr.dev
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          <footer className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 border-t border-dotted border-border pt-4 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href="https://dsqr.dev" className="transition-colors hover:text-primary">
                © {currentYear} dsqr.dev
              </a>
            </div>
            <SiteSocialLinks />
          </footer>
        </div>
      </main>
    </ThemeProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
