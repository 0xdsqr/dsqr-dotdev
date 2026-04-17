import { Github, Linkedin, Mail, Rss } from "lucide-react"
import { FooterSubscribe } from "@/components/footer-subscribe"
import { InlineSignIn } from "@/components/inline-sign-in"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-border bg-background">
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[minmax(0,1.2fr)_auto] md:items-end">
        <div className="space-y-5">
          <FooterSubscribe />
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs font-mono text-muted-foreground">© {currentYear} dsqr.dev</p>
            <InlineSignIn />
          </div>
        </div>

        <div className="flex items-center gap-4 md:justify-self-end">
          <a
            href="https://github.com/0xdsqr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="https://linkedin.com/in/davedennis93"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href="mailto:hello@dsqr.dev"
            className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            aria-label="Email"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href="/rss.xml"
            className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            aria-label="RSS Feed"
          >
            <Rss className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
