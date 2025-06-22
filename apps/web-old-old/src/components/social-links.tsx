import { Link } from '@tanstack/react-router'

function SocialLinks() {
  const linkClass = "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
  
  return (
    <nav className="flex items-center justify-center gap-4 text-sm mb-6" data-slot="social-links">
      <Link
        to="/"
        search={{category: undefined, sort: undefined, order: undefined}}
        className={linkClass}
      >
        0xdsqr
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link
        to="/posts"
        search={{category: undefined, sort: undefined, order: undefined}}
        className={linkClass}
      >
        posts
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link
        to="/misc"
        search={{category: undefined, sort: undefined, order: undefined}}
        className={linkClass}
      >
        misc
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link
        to="/about"
        search={{category: undefined, sort: undefined, order: undefined}}
        className={linkClass}
      >
        about
      </Link>
    </nav>
  )
}

export { SocialLinks }