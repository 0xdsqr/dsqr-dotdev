"use client"

import { useState } from "react"
import { authClient } from "@/auth/client"

interface UserDropdownProps {
  email: string
}

export function UserDropdown({ email }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { refetch } = authClient.useSession()

  const handleSignOut = async () => {
    setIsLoading(true)
    console.log("[SIGN-OUT] Signing out user:", email)
    await authClient.signOut()
    await refetch()
    setIsLoading(false)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <span className="text-purple-600 dark:text-purple-400 text-xs font-mono border-b-2 border-dotted border-purple-600 dark:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
          hello
        </span>
        <span className="text-purple-600 dark:text-purple-400 text-xs font-mono border-b-2 border-dotted border-purple-600 dark:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
          {email}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-900 border border-purple-600 dark:border-purple-400 rounded shadow-lg w-48 z-50">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-xs text-slate-900 dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 font-mono"
            >
              {isLoading ? "signing out..." : "sign out"}
            </button>
          </div>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  )
}
