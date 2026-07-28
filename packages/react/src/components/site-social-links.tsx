import { Mail, Rss } from "lucide-react"
import { GitHubLogo, GitLabLogo, LinkedInLogo, XLogo } from "./brand-icons"

const links = [
  ["GitHub", "https://github.com/0xdsqr", GitHubLogo],
  ["GitLab", "https://gitlab.com/dave_is_stable", GitLabLogo],
  ["X", "https://x.com/0xdsqr", XLogo],
  ["LinkedIn", "https://linkedin.com/in/davedennis93", LinkedInLogo],
  ["Email", "mailto:me@dsqr.dev", Mail],
  ["RSS Feed", "https://dsqr.dev/rss.xml", Rss],
] as const

function SiteSocialLinks() {
  return (
    <nav className="flex items-center gap-4" aria-label="Social links">
      {links.map(([label, href, Icon]) => (
        <a
          key={label}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-muted-foreground transition-colors hover:text-primary"
          aria-label={label}
        >
          <Icon className="size-4" />
        </a>
      ))}
    </nav>
  )
}

export { SiteSocialLinks }
