import { useTheme } from "@/components/theme-provider.js"
import { sun, moon } from "@/components/icons/index.js"

function FooterModeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === 'light' 
        ? sun({ hover: "purple" }) 
        : moon({ hover: "purple" })
      }
    </button>
  )
}

export { FooterModeToggle }