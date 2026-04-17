"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@dsqr-dotdev/react/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import { useState } from "react"

interface UserDropdownProps {
  email: string
  username?: string
  onSignOut?: () => void | Promise<void>
}

export function UserDropdown({ email, username, onSignOut }: UserDropdownProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    if (onSignOut) {
      await onSignOut()
    }
    setIsLoading(false)
  }

  const displayName = username || email.split("@")[0] || "user"

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 text-xs font-mono focus:outline-none group">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-purple-500/50 bg-purple-500/10 text-[9px] text-purple-600 dark:text-purple-400">
          {initials}
        </span>
        <span className="text-purple-600 dark:text-purple-400 border-b-2 border-dotted border-purple-600 dark:border-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 font-mono">
        <div className="flex items-center gap-3 px-2 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/50 bg-purple-500/10 text-xs text-purple-600 dark:text-purple-400">
            {initials}
          </span>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs font-medium truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <DropdownMenuItem
          className="text-xs text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-3 w-3" />
          {isLoading ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
