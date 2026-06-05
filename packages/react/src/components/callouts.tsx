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

// Variants map onto the design-system tokens (destructive + chart-*) so callouts
// stay theme-aware in both light and dark instead of hardcoding raw palette values.
const calloutConfigs: Record<string, CalloutConfig> = {
  important: {
    icon: <AlertCircle className="w-4 h-4" />,
    borderColor: "border-l-4 border-destructive",
    accentColor: "text-destructive",
  },
  note: {
    icon: <Info className="w-4 h-4" />,
    borderColor: "border-l-4 border-chart-4",
    accentColor: "text-chart-4",
  },
  tip: {
    icon: <Lightbulb className="w-4 h-4" />,
    borderColor: "border-l-4 border-chart-1",
    accentColor: "text-chart-1",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    borderColor: "border-l-4 border-chart-3",
    accentColor: "text-chart-3",
  },
  caution: {
    icon: <AlertOctagon className="w-4 h-4" />,
    borderColor: "border-l-4 border-destructive",
    accentColor: "text-destructive",
  },
  moreinfo: {
    icon: <Info className="w-4 h-4" />,
    borderColor: "border-l-4 border-primary",
    accentColor: "text-primary",
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
        <div className="min-w-0 flex-1 [&_em]:italic [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold">
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
