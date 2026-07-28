import { SiteSocialLinks } from "@dsqr-dotdev/react/components/site-social-links"
import { FooterSubscribe } from "@/components/footer-subscribe"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-10">
        <FooterSubscribe />
        <div className="flex flex-col items-center gap-4 font-mono text-xs sm:grid sm:grid-cols-3">
          <p className="text-muted-foreground sm:justify-self-start">© {currentYear} dsqr</p>
          <div className="flex items-center justify-center gap-2.5">
            <a
              href="https://dsqr.dev"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              dsqr.dev
            </a>
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            <a
              href="https://labs.dsqr.dev"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              labs.dsqr.dev
            </a>
          </div>
          <div className="sm:justify-self-end">
            <SiteSocialLinks />
          </div>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
