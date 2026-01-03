"use client"

import { Link, useRouterState } from "@tanstack/react-router"
import {
  FileText,
  LayoutDashboard,
  LogOut,
  PenLine,
  Settings,
  Share2,
} from "lucide-react"
import { authClient } from "@/auth/client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Blog Posts", icon: FileText, href: "/posts" },
  { title: "Social Posts", icon: Share2, href: "/social", badge: "Soon" },
]

const settingsItems = [{ title: "Settings", icon: Settings, href: "/settings" }]

export function AppSidebar() {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { data: session } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "https://dsqr.dev/"
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600">
            <PenLine className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Content Studio
            </span>
            <span className="text-xs text-muted-foreground">
              Manage your content
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? currentPath === "/"
                        : currentPath.startsWith(item.href)
                    }
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith(item.href)}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {session?.user?.name?.slice(0, 2).toUpperCase() || "AD"}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {session?.user?.name || "Admin"}
              </span>
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
