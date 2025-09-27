import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "@/components/theme-provider.js"
import { Button } from "@/components/ui/button.js"

function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-4 h-4 sm:w-5 sm:h-5 p-0"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export { ThemeToggle }
