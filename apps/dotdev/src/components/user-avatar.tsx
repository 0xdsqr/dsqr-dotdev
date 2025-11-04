"use client"

import { useState } from "react"
import { SignInModal } from "./sign-in-modal"

function UserAvatar() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors text-xs font-mono border-b-2 border-dotted border-purple-600 dark:border-purple-400"
      >
        sign in
      </button>
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

export { UserAvatar }
