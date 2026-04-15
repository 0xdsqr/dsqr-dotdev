import { createFileRoute } from "@tanstack/react-router"
import { Bell, Palette, Shield, User } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <>
      <SiteHeader breadcrumbs={[{ label: "System" }, { label: "Settings" }]} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your studio preferences and account.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SettingsCard
            icon={User}
            title="Profile"
            description="Manage your display name, avatar, and bio."
            status="coming-soon"
          />
          <SettingsCard
            icon={Palette}
            title="Appearance"
            description="Theme preferences, sidebar behavior, and layout options."
            status="coming-soon"
          />
          <SettingsCard
            icon={Shield}
            title="Security"
            description="Two-factor authentication, sessions, and API keys."
            status="coming-soon"
          />
          <SettingsCard
            icon={Bell}
            title="Notifications"
            description="Email preferences and alert settings."
            status="coming-soon"
          />
        </div>
      </div>
    </>
  )
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  status: "active" | "coming-soon"
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 ${status === "coming-soon" ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
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
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
