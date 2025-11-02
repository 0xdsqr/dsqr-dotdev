"use client"

import { Check, Copy } from "lucide-react"
import React, { useMemo } from "react"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  children: React.ReactNode
  language?: string
  filename?: string
  className?: string
}

export function CodeBlock({
  children,
  language,
  filename,
  className,
}: CodeBlockProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  // Extract plain text from children
  const plainText = useMemo(() => {
    if (typeof children === "string") return children
    if (Array.isArray(children)) {
      return children
        .map((child) => {
          if (typeof child === "string") return child
          if (child?.props?.children) {
            if (typeof child.props.children === "string") {
              return child.props.children
            }
            if (Array.isArray(child.props.children)) {
              return child.props.children.join("")
            }
          }
          return ""
        })
        .join("")
    }
    return ""
  }, [children])

  React.useEffect(() => {
    if (!hasCopied) return
    const timer = setTimeout(() => {
      setHasCopied(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [hasCopied])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(plainText)
    setHasCopied(true)
  }

  return (
    <div
      className={cn(
        "relative my-6 overflow-hidden rounded-lg border border-border bg-background",
        className,
      )}
    >
      {/* Header */}
      {(filename || language) && (
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-medium text-foreground/80">
                {filename}
              </span>
            )}
            {language && (
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {language}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Code Container */}
      <div className="relative overflow-x-auto bg-background">
        <pre
          className={cn(
            "bg-background px-4 py-3 text-sm font-mono text-foreground",
            "leading-relaxed",
            !filename && !language && "rounded-lg",
          )}
        >
          {children}
        </pre>

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className={cn(
            "absolute top-3 right-3 inline-flex items-center justify-center",
            "h-8 w-8 rounded-md border border-border/50",
            "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          )}
          title={hasCopied ? "Copied!" : "Copy code"}
        >
          <span className="sr-only">Copy code</span>
          {hasCopied ? (
            <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
