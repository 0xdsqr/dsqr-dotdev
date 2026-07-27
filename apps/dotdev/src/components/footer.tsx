import { SiteSocialLinks } from "@dsqr-dotdev/react/components/site-social-links"
import { FooterSubscribe } from "@/components/footer-subscribe"
import { InlineSignIn } from "@/components/inline-sign-in"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
        <FooterSubscribe />
        <div className="flex flex-col gap-4 border-t border-dotted border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
            <p>© {currentYear} dsqr.dev</p>
            <a
              href="https://labs.dsqr.dev"
              className="text-purple-600 underline decoration-2 decoration-dotted underline-offset-4 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              labs.dsqr.dev
            </a>
            <InlineSignIn />
          </div>
          <SiteSocialLinks />
        </div>
      </div>
    </footer>
  )
}

export { Footer }
