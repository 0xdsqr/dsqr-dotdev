import type React from "react"
import { cn } from "@dsqr-dotdev/react/lib/utils"

function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Eyebrow }
