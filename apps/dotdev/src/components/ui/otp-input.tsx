import type * as React from "react"
import { cn } from "@/lib/utils"

interface OTPInputProps extends React.ComponentProps<"input"> {}

function OTPInput({ className, ...props }: OTPInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      data-slot="input"
      className={cn(
        "bg-transparent text-xs border-0 border-b-2 border-purple-600 dark:border-purple-400 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none px-1 py-0.5",
        className,
      )}
      {...props}
    />
  )
}

export { OTPInput }
