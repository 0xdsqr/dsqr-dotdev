"use client"

import { Button } from "@dsqr-dotdev/react/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@dsqr-dotdev/react/components/ui/dropdown-menu"
import { Laptop2, MoonStar, Palette, SunMedium } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="gap-2 font-mono" />}
      >
        <Palette className="size-4" />
        theme
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as typeof theme)}
        >
          <DropdownMenuRadioItem value="light">
            <SunMedium className="size-4" />
            light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonStar className="size-4" />
            dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Laptop2 className="size-4" />
            system
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
