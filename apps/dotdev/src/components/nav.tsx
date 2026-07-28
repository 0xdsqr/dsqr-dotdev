"use client"

import { Link, useRouterState } from "@tanstack/react-router"
import { ThemeToggle } from "@dsqr-dotdev/react/components/theme-toggle"
import { InlineSignIn } from "@/components/inline-sign-in"

function Nav() {
  const router = useRouterState()
  const pathname = router.location.pathname

  const getLinkClass = (active: boolean) => {
    const baseClass =
      "text-primary hover:text-primary/80 transition-colors whitespace-nowrap text-sm"
    return active ? `${baseClass} font-semibold border-b-2 border-dotted border-primary` : baseClass
  }

  const navItems = [
    { label: "0xdsqr", href: "/" },
    { label: "posts", href: "/posts" },
    { label: "about", href: "/about" },
    { label: "misc", href: "/misc" },
  ]

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3 font-mono animate-in fade-in slide-in-from-top-2 duration-300">
            {navItems.map((item, index) => (
              <div key={item.href} className="flex items-center gap-3">
                {index > 0 && <span className="text-muted-foreground text-sm">/</span>}
                <Link
                  to={item.href}
                  className={getLinkClass(
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
                  )}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <InlineSignIn />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}

export { Nav }
