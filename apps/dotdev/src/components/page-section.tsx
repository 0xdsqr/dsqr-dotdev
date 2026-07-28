import { SectionHeading } from "@dsqr-dotdev/react/components/section-heading"
import { cn } from "@/lib/utils"

export function PageSection({
  id,
  title,
  last = false,
  children,
}: {
  id: string
  title: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 space-y-5",
        !last && "border-b border-dashed border-border pb-12",
      )}
    >
      <SectionHeading>{title}</SectionHeading>
      {children}
    </section>
  )
}
