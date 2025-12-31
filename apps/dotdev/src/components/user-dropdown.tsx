"use client"

import { LogOut, Settings } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsModal } from "./settings-modal"

interface UserDropdownProps {
  email: string
  username?: string
  avatarUrl?: string
  onSignOut?: () => void | Promise<void>
}

export function UserDropdown({
  email,
  username,
  avatarUrl,
  onSignOut,
}: UserDropdownProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-mono focus:outline-none group"
        >
          <Avatar className="h-5 w-5 border border-purple-500/50">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-purple-600 dark:text-purple-400 border-b-2 border-dotted border-purple-600 dark:border-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 font-mono">
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="h-8 w-8 border border-purple-500/50">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-xs font-medium truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-xs"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="mr-2 h-3 w-3" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs text-rose-600 dark:text-rose-400"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-3 w-3" />
          {isLoading ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        email={email}
        username={username}
        avatarUrl={avatarUrl}
      />
    </DropdownMenu>
  )
}
