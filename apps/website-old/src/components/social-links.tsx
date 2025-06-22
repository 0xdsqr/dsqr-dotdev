import { Link } from '@tanstack/react-router'

export function SocialLinks() {
  return (
    <nav className="flex items-center justify-center gap-4 text-sm mb-6">
      <Link
        to="/"
        search={{category: undefined, sort: undefined, order: undefined}}
        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
      >
        0xdsqr
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link
        to="/posts"
        search={{category: undefined, sort: undefined, order: undefined}}
        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
      >
        posts
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link
        to="/misc"
        search={{category: undefined, sort: undefined, order: undefined}}
        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
      >
        misc
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link
        to="/about"
        search={{category: undefined, sort: undefined, order: undefined}}
        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
      >
        about
      </Link>
    </nav>
  )
}