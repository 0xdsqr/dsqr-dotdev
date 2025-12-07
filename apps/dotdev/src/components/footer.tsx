import { Github, Linkedin, Mail, Rss } from "lucide-react"
import { InlineSignIn } from "@/components/inline-sign-in"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left - copyright */}
          <p className="text-xs text-muted-foreground font-mono">
            © {currentYear} dsqr.dev
          </p>

          {/* Center - inline sign in */}
          <InlineSignIn />

          {/* Right - socials */}
          <div className="flex items-center gap-4">
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
      </div>
    </footer>
  )
}

export { Footer }
