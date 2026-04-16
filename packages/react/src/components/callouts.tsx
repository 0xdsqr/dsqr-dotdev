import { AlertCircle, AlertOctagon, AlertTriangle, Info, Lightbulb } from "lucide-react"
import type React from "react"
import { cn } from "@dsqr-dotdev/react/lib/utils"

interface CalloutProps {
  children: React.ReactNode
  className?: string
}

interface CalloutConfig {
  icon: React.ReactNode
  borderColor: string
  accentColor: string
}

const calloutConfigs: Record<string, CalloutConfig> = {
  important: {
    icon: <AlertCircle className="w-4 h-4" />,
    borderColor: "border-l-4 border-red-600 dark:border-red-400",
    accentColor: "text-red-600 dark:text-red-400",
  },
  note: {
    icon: <Info className="w-4 h-4" />,
    borderColor: "border-l-4 border-blue-600 dark:border-blue-400",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  tip: {
    icon: <Lightbulb className="w-4 h-4" />,
    borderColor: "border-l-4 border-emerald-600 dark:border-emerald-400",
    accentColor: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    borderColor: "border-l-4 border-amber-600 dark:border-amber-400",
    accentColor: "text-amber-600 dark:text-amber-400",
  },
  caution: {
    icon: <AlertOctagon className="w-4 h-4" />,
    borderColor: "border-l-4 border-red-700 dark:border-red-300",
    accentColor: "text-red-700 dark:text-red-300",
  },
  moreinfo: {
    icon: <Info className="w-4 h-4" />,
    borderColor: "border-l-4 border-purple-600 dark:border-purple-400",
    accentColor: "text-purple-600 dark:text-purple-400",
  },
}

function Callout({
  children,
  variant,
  className,
}: CalloutProps & { variant: keyof typeof calloutConfigs }) {
  const config = calloutConfigs[variant]
  const isMoreInfo = variant === "moreinfo"

  return (
    <div
      className={cn(
        "my-6 border-l-4 py-2 pl-4 font-sans text-sm leading-relaxed",
        config.borderColor,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {isMoreInfo ? (
          <div className="mt-0.5 size-8 shrink-0 overflow-hidden rounded border border-border bg-muted">
            <img src="/me.jpeg" alt="0xdsqr" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className={cn("mt-0.5 shrink-0", config.accentColor)}>{config.icon}</div>
        )}
        <div className="min-w-0 flex-1 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-foreground [&_em]:italic [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Important({ children, className }: CalloutProps) {
  return (
    <Callout variant="important" className={className}>
      {children}
    </Callout>
  )
}

export function Note({ children, className }: CalloutProps) {
  return (
    <Callout variant="note" className={className}>
      {children}
    </Callout>
  )
}

export function Tip({ children, className }: CalloutProps) {
  return (
    <Callout variant="tip" className={className}>
      {children}
    </Callout>
  )
}

export function Warning({ children, className }: CalloutProps) {
  return (
    <Callout variant="warning" className={className}>
      {children}
    </Callout>
  )
}

export function Caution({ children, className }: CalloutProps) {
  return (
    <Callout variant="caution" className={className}>
      {children}
    </Callout>
  )
}

export function MoreInfo({ children, className }: CalloutProps) {
  return (
    <Callout variant="moreinfo" className={className}>
      {children}
    </Callout>
  )
}
