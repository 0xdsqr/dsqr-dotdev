import { Button } from "@dsqr-dotdev/react/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@dsqr-dotdev/react/components/ui/breadcrumb"
import { Separator } from "@dsqr-dotdev/react/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@dsqr-dotdev/react/components/ui/sidebar"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { FilePenLine, LayoutDashboard, Mailbox, Users } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@dsqr-dotdev/react/components/theme-toggle"
import { authClient } from "../auth/client"
import { DashboardSection } from "../components/sections/dashboard"
import { PostsSection } from "../components/sections/posts"
import { SubscribersSection } from "../components/sections/subscribers"
import { UsersSection } from "../components/sections/users"
import { getAdminSessionUser } from "../lib/admin-access"
import { getAdminBootstrap } from "../lib/admin-data"
import { getDotdevBaseUrl } from "../lib/runtime-url"

type SectionId = "posts" | "dashboard" | "users" | "subscribers"

const sectionItems: Array<{
  id: SectionId
  label: string
  description: string
  icon: typeof LayoutDashboard
}> = [
  { id: "posts", label: "posts", description: "manage content", icon: FilePenLine },
  { id: "dashboard", label: "dashboard", description: "status + activity", icon: LayoutDashboard },
  { id: "users", label: "users", description: "roles + access", icon: Users },
  { id: "subscribers", label: "subscribers", description: "email list", icon: Mailbox },
]

export const Route = createFileRoute("/")({
  loader: async () => {
    const adminUser = await getAdminSessionUser()

    if (!adminUser) {
      throw redirect({ to: "/login" })
    }

    return getAdminBootstrap()
  },
  component: StudioPage,
})

function StudioPage() {
  const { adminUser, posts, users, subscribers } = Route.useLoaderData()
  const dotdevBaseUrl = getDotdevBaseUrl()
  const [activeSection, setActiveSection] = useState<SectionId>("posts")

  const activeSectionItem =
    sectionItems.find((item) => item.id === activeSection) ?? sectionItems[0]

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-4 border-b border-sidebar-border px-4 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="px-2" tooltip="studio">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <span className="font-mono text-sm font-semibold">s</span>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-mono text-sm font-semibold">studio</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    studio.dsqr.dev
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sectionItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeSection === item.id}
                        tooltip={item.label}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <Icon className="size-4" />
                        <div className="grid flex-1 text-left leading-tight">
                          <span>{item.label}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-xs font-mono text-muted-foreground">
                <span className="block truncate text-foreground">{adminUser.email}</span>
                <span>admin access</span>
              </div>
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full font-mono"
              onClick={async () => {
                await authClient.signOut()
                window.location.href = "/login"
              }}
            >
              sign out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        <div className="flex min-h-screen flex-col">
          <header className="flex h-16 items-center gap-3 border-b border-border px-4 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <div className="space-y-1">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      studio
                    </span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-mono text-sm lowercase">
                      {activeSectionItem.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <p className="text-sm text-muted-foreground">{activeSectionItem.description}</p>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            {activeSection === "dashboard" ? (
              <DashboardSection posts={posts} users={users} subscribers={subscribers} />
            ) : null}
            {activeSection === "posts" ? (
              <PostsSection posts={posts} dotdevBaseUrl={dotdevBaseUrl} />
            ) : null}
            {activeSection === "users" ? <UsersSection users={users} /> : null}
            {activeSection === "subscribers" ? (
              <SubscribersSection subscribers={subscribers} />
            ) : null}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
