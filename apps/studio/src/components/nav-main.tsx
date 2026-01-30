import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@dsqr-dotdev/ui/components/sidebar"
import { Link, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  external?: boolean
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={
                  item.url === "/"
                    ? currentPath === "/"
                    : currentPath.startsWith(item.url)
                }
                render={
                  item.external
                    ? (props) => (
                        <a
                          {...props}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      )
                    : (props) => <Link {...props} to={item.url} />
                }
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
