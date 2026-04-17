"use client"

import { Button } from "@dsqr-dotdev/react/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative size-8 p-0"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
