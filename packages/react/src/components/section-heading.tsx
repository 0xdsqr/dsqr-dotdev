import type React from "react"
import { cn } from "@dsqr-dotdev/react/lib/utils"

type SectionHeadingProps = React.ComponentProps<"h2"> & {
  as?: "h1" | "h2"
}

function SectionHeading({ as: Tag = "h2", className, ...props }: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        "inline-block border-b-2 border-dotted border-primary pb-2 font-mono font-bold",
        Tag === "h1" ? "text-2xl" : "text-xl",
        className,
      )}
      {...props}
    />
  )
}

export { SectionHeading }
