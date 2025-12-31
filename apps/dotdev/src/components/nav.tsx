"use client"

import { Link, useRouterState } from "@tanstack/react-router"
import { motion } from "framer-motion"
import { InlineSignIn } from "@/components/inline-sign-in"
import { ThemeToggle } from "@/components/theme-toggle"

function Nav() {
  const router = useRouterState()
  const pathname = router.location.pathname

  const getLinkClass = (active: boolean) => {
    const baseClass =
      "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors whitespace-nowrap text-sm"
    return active
      ? `${baseClass} font-semibold border-b-2 border-dotted border-purple-600 dark:border-purple-400`
      : baseClass
  }

  const navItems = [
    { label: "0xdsqr", href: "/" },
    { label: "posts", href: "/posts" },
    { label: "misc", href: "/misc" },
    { label: "about", href: "/about" },
  ]

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <motion.div
            className="flex items-center gap-3 font-mono"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            {navItems.map((item, index) => (
              <div key={item.href} className="flex items-center gap-3">
                {index > 0 && (
                  <span className="text-muted-foreground text-sm">/</span>
                )}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    to={item.href}
                    className={getLinkClass(
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href),
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              </div>
            ))}
          </motion.div>

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
