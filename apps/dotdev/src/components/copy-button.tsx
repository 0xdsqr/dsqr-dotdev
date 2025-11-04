"use client"

import { Check, Copy } from "lucide-react"
import React, { useState } from "react"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  className?: string
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasCopied(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [hasCopied])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value)
    setHasCopied(true)
  }

  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className={cn(
        "absolute top-3 right-3 p-1.5 rounded transition-all duration-200",
        "text-muted-foreground/60 hover:text-foreground",
        "hover:bg-transparent dark:hover:bg-transparent",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        className,
      )}
      title={hasCopied ? "Copied!" : "Copy to clipboard"}
    >
      <span className="sr-only">Copy code</span>
      {hasCopied ? (
        <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  )
}
