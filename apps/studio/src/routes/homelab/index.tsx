import { createFileRoute } from "@tanstack/react-router"
import { Server, Container, Network, HardDrive, Activity } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

export const Route = createFileRoute("/homelab/")({
  component: HomelabPage,
})

function HomelabPage() {
  return (
    <>
      <SiteHeader
        breadcrumbs={[
          { label: "Homelab" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homelab</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage your self-hosted infrastructure.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PlaceholderCard
            icon={Server}
            title="Services"
            description="Docker containers, reverse proxies, and service health."
          />
          <PlaceholderCard
            icon={Network}
            title="Network"
            description="DNS records, VPN tunnels, and network topology."
          />
          <PlaceholderCard
            icon={HardDrive}
            title="Storage"
            description="Disk usage, NAS volumes, and backup schedules."
          />
          <PlaceholderCard
            icon={Activity}
            title="Monitoring"
            description="CPU, memory, bandwidth, and uptime metrics."
          />
          <PlaceholderCard
            icon={Container}
            title="Containers"
            description="Docker compose stacks and container logs."
          />
        </div>

        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Homelab module is under development. This will integrate with your
            self-hosted services for monitoring and management.
          </p>
        </div>
      </div>
    </>
  )
}

function PlaceholderCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5 opacity-60">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            Coming Soon
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
