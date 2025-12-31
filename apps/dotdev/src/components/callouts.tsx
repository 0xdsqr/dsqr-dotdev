import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  Lightbulb,
} from "lucide-react"
import type React from "react"
import { cn } from "@/lib/utils"

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
        isMoreInfo
          ? "my-6 pl-4 py-2 border-l-4 font-sans text-sm leading-relaxed"
          : "my-6 pl-4 py-2 border-l-4 font-sans text-sm leading-relaxed",
        config.borderColor,
        className,
      )}
    >
      <div className="flex gap-3 items-start">
        {isMoreInfo ? (
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-muted border border-border">
            <img
              src="/me.jpeg"
              alt="0xdsqr"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={cn("mt-0.5 flex-shrink-0", config.accentColor)}>
            {config.icon}
          </div>
        )}
        <div className="flex-1 min-w-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted [&_code]:text-foreground">
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
