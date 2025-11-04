"use client"

import { LogOut, User } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    if (onSignOut) {
      await onSignOut()
    }
    setIsLoading(false)
  }

  const getInitials = (name: string | undefined) => {
    return (name || "U").substring(0, 2).toUpperCase()
  }

  const displayName = username || email || "user"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
          >
            <Avatar className="h-6 w-6 !rounded border border-border flex-shrink-0">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl || "/placeholder.svg"}
                  alt={displayName}
                />
              )}
              <AvatarFallback className="bg-purple-600 dark:bg-purple-500 text-white text-xs font-mono !rounded">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-purple-600 dark:text-purple-400 text-xs font-mono border-b-2 border-dotted border-purple-600 dark:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
              {displayName}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 font-mono text-xs">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-medium leading-none">my account</p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsSettingsOpen(true)}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isLoading}
            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoading ? "signing out..." : "sign out"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        email={email}
        username={username}
        avatarUrl={avatarUrl}
      />
    </>
  )
}
