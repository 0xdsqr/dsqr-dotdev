import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowRight,
  Eye,
  FileText,
  MessageSquare,
  PenLine,
  Plus,
  Settings,
  TrendingUp,
} from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

export const Route = createFileRoute("/")({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-4 border-b border-border px-6 py-4">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Posts"
            value="--"
            icon={FileText}
            description="Published articles"
            trend="+2 this week"
          />
          <StatCard
            title="Total Views"
            value="--"
            icon={Eye}
            description="All time views"
            trend="+12% from last month"
          />
          <StatCard
            title="Comments"
            value="--"
            icon={MessageSquare}
            description="Total comments"
            trend="+5 new"
          />
          <StatCard
            title="Engagement"
            value="--"
            icon={TrendingUp}
            description="Avg. per post"
            trend="Trending up"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              title="New Blog Post"
              description="Create and publish a new article"
              icon={Plus}
              href="/posts/new"
              primary
            />
            <QuickActionCard
              title="Manage Posts"
              description="Edit, publish, or delete existing posts"
              icon={PenLine}
              href="/posts"
            />
            <QuickActionCard
              title="Settings"
              description="Configure your admin panel"
              icon={Settings}
              href="/settings"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  trend?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  primary,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  primary?: boolean
}) {
  return (
    <Link
      to={href}
      className={`group relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md ${
        primary
          ? "border-purple-600/20 bg-gradient-to-br from-purple-600/5 to-purple-600/10 hover:border-purple-600/40"
          : "border-border bg-card hover:bg-accent/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${
              primary
                ? "bg-purple-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight
          className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
            primary
              ? "text-purple-600 dark:text-purple-400"
              : "text-muted-foreground"
          }`}
        />
      </div>
    </Link>
  )
}
