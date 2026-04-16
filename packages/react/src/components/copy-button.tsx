"use client"

import { Check, Copy } from "lucide-react"
import React, { useState } from "react"
import { cn } from "@dsqr-dotdev/react/lib/utils"

interface CopyButtonProps {
  value: string
  className?: string
}

function legacyCopyToClipboard(value: string) {
  const textArea = document.createElement("textarea")
  textArea.value = value
  textArea.setAttribute("readonly", "")
  textArea.style.position = "fixed"
  textArea.style.opacity = "0"
  textArea.style.pointerEvents = "none"

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  textArea.setSelectionRange(0, value.length)

  let hasCopied = false
  try {
    hasCopied = document.execCommand("copy")
  } catch {
    hasCopied = false
  }

  document.body.removeChild(textArea)
  return hasCopied
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false)

  React.useEffect(() => {
    if (!hasCopied) {
      return
    }

    const timer = setTimeout(() => setHasCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [hasCopied])

  const copyToClipboard = async () => {
    if (!value) {
      return
    }

    let copied = false

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value)
        copied = true
      } catch {
        copied = legacyCopyToClipboard(value)
      }
    } else {
      copied = legacyCopyToClipboard(value)
    }

    if (copied) {
      setHasCopied(true)
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void copyToClipboard()
      }}
      className={cn(
        "absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-md border border-border/70 bg-background/80 text-muted-foreground/80 backdrop-blur transition-colors duration-200 hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      title={hasCopied ? "Copied!" : "Copy to clipboard"}
    >
      <span className="sr-only">Copy code</span>
      {hasCopied ? (
        <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  )
}
