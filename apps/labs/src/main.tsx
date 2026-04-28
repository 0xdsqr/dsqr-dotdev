import { ThemeProvider } from "@dsqr-dotdev/react/components/theme-provider"
import { ThemeToggle } from "@dsqr-dotdev/react/components/theme-toggle"
import { Github } from "lucide-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

function XLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M13.9 10.47 21.35 2h-1.76l-6.47 7.35L7.96 2H2l7.81 11.12L2 22h1.76l6.83-7.77L16.04 22H22zM11.48 13.21l-.79-1.1L4.4 3.3h2.72l5.08 7.11.79 1.1 6.6 9.24h-2.72z" />
    </svg>
  )
}

const socialLinks = [
  ["GitHub", "https://github.com/dsqr-labs", Github],
  ["X", "https://x.com/dsqr_labs", XLogo],
] as const

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="dsqr-labs-theme">
      <main className="min-h-dvh overflow-hidden bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-20rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-teal-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_68%)]" />
        </div>

        <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4 border-b border-dotted border-border pb-4 font-mono text-sm">
            <nav className="flex items-center gap-3">
              <a
                href="/"
                className="font-semibold text-primary underline decoration-dotted decoration-2 underline-offset-4 transition-colors hover:text-primary/75"
              >
                labs
              </a>
              <span className="text-muted-foreground">/</span>
              <a
                href="https://dsqr.dev"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                dsqr.dev
              </a>
            </nav>
            <ThemeToggle />
          </header>

          <section className="flex items-start justify-center pt-20 sm:pt-28 lg:pt-32">
            <div className="max-w-3xl text-center">
              <div className="mx-auto inline-flex flex-col items-center gap-3">
                <p className="font-mono text-sm font-semibold uppercase tracking-[0.36em] text-primary">
                  DSQR Labs LLC
                </p>
                <div className="h-px w-36 bg-gradient-to-r from-transparent via-primary/55 to-transparent" />
              </div>

              <div className="mx-auto mt-7 max-w-2xl space-y-5 text-pretty font-mono text-sm leading-8 text-muted-foreground sm:text-base">
                <p>
                  DSQR Labs LLC is a one-person consulting and product studio run by{" "}
                  <a
                    href="https://dsqr.dev"
                    className="border-b-2 border-dotted border-foreground/60 text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    0xdsqr
                  </a>
                  , focused on{" "}
                  <span className="border-b-2 border-dotted border-purple-600/60 text-purple-600 dark:border-purple-400/60 dark:text-purple-400">
                    systems engineering
                  </span>
                  ,{" "}
                  <span className="border-b-2 border-dotted border-teal-600/60 text-teal-600 dark:border-teal-400/60 dark:text-teal-400">
                    infrastructure
                  </span>
                  ,{" "}
                  <span className="border-b-2 border-dotted border-orange-500/60 text-orange-600 dark:border-orange-300/60 dark:text-orange-300">
                    cloud platforms
                  </span>
                  ,{" "}
                  <span className="border-b-2 border-dotted border-emerald-600/60 text-emerald-600 dark:border-emerald-400/60 dark:text-emerald-400">
                    open source software
                  </span>
                  , and general software development for systems that need to stay understandable,
                  operable, and boring in the best way.
                </p>
              </div>
            </div>
          </section>

          <footer className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 border-t border-dotted border-border pt-4 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>DSQR Labs LLC 2026</p>
            <nav className="flex items-center gap-4" aria-label="Social links">
              {socialLinks.map(([label, href, Icon]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-purple-600 dark:hover:text-purple-400"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </nav>
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
