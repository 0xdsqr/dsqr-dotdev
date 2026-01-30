import { createFileRoute, Link } from "@tanstack/react-router"
import {
  Newspaper,
  Server,
  PenLine,
  Activity,
  ArrowRight,
  FileText,
  Plus,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <>
      <SiteHeader breadcrumbs={[{ label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your personal studio for content, homelab, and everything in
            between.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={Plus}
            label="New Post"
            description="Write a blog post"
            href="/blog/new"
          />
          <QuickAction
            icon={FileText}
            label="Manage Posts"
            description="Edit existing content"
            href="/blog"
          />
          <QuickAction
            icon={PenLine}
            label="Social"
            description="Coming soon"
            href="/social"
            disabled
          />
          <QuickAction
            icon={Server}
            label="Homelab"
            description="Coming soon"
            href="/homelab"
            disabled
          />
        </div>

        {/* Module Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            icon={Newspaper}
            title="Blog"
            description="Create and manage blog posts, drafts, and published content."
            href="/blog"
            status="active"
          />
          <ModuleCard
            icon={PenLine}
            title="Social"
            description="Schedule and manage social media posts across platforms."
            status="coming-soon"
          />
          <ModuleCard
            icon={Server}
            title="Services"
            description="Monitor and manage your homelab Docker containers and services."
            status="coming-soon"
          />
          <ModuleCard
            icon={Activity}
            title="Monitoring"
            description="System metrics, uptime tracking, and health dashboards."
            status="coming-soon"
          />
        </div>
      </div>
    </>
  )
}

function QuickAction({
  icon: Icon,
  label,
  description,
  href,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  href: string
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="group relative flex items-center gap-3 rounded-lg border bg-card p-3 opacity-50 cursor-not-allowed">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </div>
    )
  }

  return (
    <Link
      to={href}
      className="group relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  )
}

function ModuleCard({
  icon: Icon,
  title,
  description,
  href,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href?: string
  status: "active" | "coming-soon"
}) {
  const content = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            status === "active"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {status === "coming-soon" && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )

  if (status === "active" && href) {
    return (
      <Link
        to={href}
        className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 opacity-60">{content}</div>
  )
}
