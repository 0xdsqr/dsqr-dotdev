import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@dsqr-dotdev/ui/components/sidebar"
import {
  FileText,
  LayoutDashboard,
  Monitor,
  Newspaper,
  PenLine,
  Settings,
  Shield,
} from "lucide-react"
import { type NavItem, NavMain } from "@/components/nav-main"
import { type ModuleItem, NavModules } from "@/components/nav-modules"
import { NavUser } from "@/components/nav-user"

const overviewItems: NavItem[] = [{ title: "Dashboard", url: "/", icon: LayoutDashboard }]

const contentModules: ModuleItem[] = [
  {
    title: "Blog",
    icon: Newspaper,
    url: "/blog",
    items: [
      { title: "All Posts", url: "/blog" },
      { title: "New Post", url: "/blog/new" },
    ],
  },
  {
    title: "Social",
    icon: PenLine,
    url: "/social",
    badge: "Soon",
  },
]

const homelabModules: ModuleItem[] = [
  {
    title: "Virtual Machines",
    icon: Monitor,
    url: "/homelab",
  },
]

const systemModules: ModuleItem[] = [
  {
    title: "Settings",
    icon: Settings,
    url: "/settings",
  },
  {
    title: "Security",
    icon: Shield,
    url: "/settings/security",
    badge: "Soon",
  },
]

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none">dsqr studio</span>
            <span className="text-xs text-muted-foreground">personal hq</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={overviewItems} />
        <SidebarSeparator />
        <NavModules label="Content" modules={contentModules} />
        <NavModules label="Homelab" modules={homelabModules} />
        <NavModules label="System" modules={systemModules} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
