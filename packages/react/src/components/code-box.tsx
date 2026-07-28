import { CopyButton } from "@dsqr-dotdev/react/components/copy-button"
import { cn } from "@dsqr-dotdev/react/lib/utils"

interface CodeBoxProps {
  value: string
  label?: string
  className?: string
}

function CodeBox({ value, label, className }: CodeBoxProps) {
  return (
    <div
      className={cn(
        "relative rounded-md border border-dotted border-border bg-muted/30",
        className,
      )}
    >
      {label ? (
        <span className="absolute -top-2 left-3 bg-background px-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </span>
      ) : null}
      <CopyButton value={value} className="top-2 right-2" />
      <pre className="max-h-72 overflow-auto p-4 pr-14 font-mono text-xs leading-6 text-foreground">
        <code>{value}</code>
      </pre>
    </div>
  )
}

export { CodeBox }
