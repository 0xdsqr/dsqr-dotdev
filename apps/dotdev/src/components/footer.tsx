import { SiteSocialLinks } from "@dsqr-dotdev/react/components/site-social-links"
import { FooterSubscribe } from "@/components/footer-subscribe"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <FooterSubscribe />
        <div className="flex flex-col gap-4 border-t border-dotted border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
            <p>© {currentYear} dsqr.dev</p>
            <a
              href="https://labs.dsqr.dev"
              className="text-primary underline decoration-2 decoration-dotted underline-offset-4 transition-colors hover:text-primary/80"
            >
              labs.dsqr.dev
            </a>
          </div>
          <SiteSocialLinks />
        </div>
      </div>
    </footer>
  )
}

export { Footer }
