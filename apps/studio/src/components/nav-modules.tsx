import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@dsqr-dotdev/ui/components/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@dsqr-dotdev/ui/components/sidebar"
import { Link, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

export interface ModuleSubItem {
  title: string
  url: string
}

export interface ModuleItem {
  title: string
  icon: LucideIcon
  url: string
  badge?: string
  items?: ModuleSubItem[]
}

interface NavModulesProps {
  label: string
  modules: ModuleItem[]
}

export function NavModules({ label, modules }: NavModulesProps) {
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {modules.map((mod) => {
            const isModuleActive = currentPath.startsWith(mod.url)

            if (mod.items && mod.items.length > 0) {
              return (
                <Collapsible
                  key={mod.title}
                  defaultOpen={isModuleActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      render={(props) => (
                        <SidebarMenuButton
                          {...props}
                          tooltip={mod.title}
                          isActive={isModuleActive}
                        />
                      )}
                    >
                      <mod.icon />
                      <span>{mod.title}</span>
                      {mod.badge ? (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {mod.badge}
                        </span>
                      ) : (
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {mod.items.map((sub) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              isActive={currentPath === sub.url}
                              render={(props) => <Link {...props} to={sub.url} />}
                            >
                              <span>{sub.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }

            return (
              <SidebarMenuItem key={mod.title}>
                <Link to={mod.url}>
                  <SidebarMenuButton tooltip={mod.title} isActive={isModuleActive}>
                    <mod.icon />
                    <span>{mod.title}</span>
                    {mod.badge && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {mod.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
