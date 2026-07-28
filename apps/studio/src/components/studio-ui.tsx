import { Button } from "@dsqr-dotdev/react/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@dsqr-dotdev/react/components/ui/card"
import { Label } from "@dsqr-dotdev/react/components/ui/label"
import { ArrowUpDown } from "lucide-react"
import type { ReactNode } from "react"

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: number
  suffix?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="font-mono text-xs uppercase tracking-[0.25em]">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-3xl font-semibold">
          {value}
          {suffix ? <span className="ml-1 text-lg text-muted-foreground">{suffix}</span> : null}
        </p>
      </CardContent>
    </Card>
  )
}

export function TableHeaderButton({ label, onClick }: { label: string; onClick?: () => void }) {
  if (!onClick) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  )
}
