import { Link, useLocation } from "@tanstack/react-router"
import { motion } from "framer-motion"

function NavSocials() {
  const location = useLocation()
  const isHome = location.pathname === "/"
  const isPosts = location.pathname.startsWith("/posts")
  const isMisc = location.pathname === "/misc"
  const isAbout = location.pathname === "/about"

  const getLinkClass = (active: boolean) => {
    const baseClass =
      "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors whitespace-nowrap"
    return active
      ? `${baseClass} font-semibold border-b-2 border-dotted border-purple-600 dark:border-purple-400`
      : baseClass
  }

  return (
    <motion.nav
      className="flex items-center justify-center gap-4 text-base mb-0 mt-6 font-mono flex-wrap"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Link to="/" className={getLinkClass(isHome)}>
          0xdsqr
        </Link>
      </motion.div>
      <span className="text-muted-foreground">/</span>
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Link to="/posts" className={getLinkClass(isPosts)}>
          posts
        </Link>
      </motion.div>
      <span className="text-muted-foreground">/</span>
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Link to="/misc" className={getLinkClass(isMisc)}>
          misc
        </Link>
      </motion.div>
      <span className="text-muted-foreground">/</span>
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Link to="/about" className={getLinkClass(isAbout)}>
          about
        </Link>
      </motion.div>
    </motion.nav>
  )
}

export { NavSocials }
