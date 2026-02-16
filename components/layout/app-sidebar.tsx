"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

import type { AppRole } from "@/app/lib/auth/roles"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  getRoutePath,
  getNavigationRoutes,
} from "@/app/lib/navigation/route-config"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getRouteLabel, NavigationIcon } from "@/components/layout/navigation-utils"
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu"

interface AppSidebarProps {
  role: AppRole
  userName: string
  userEmail: string
  userImage: string | null
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AppSidebar({
  role,
  userName,
  userEmail,
  userImage,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()
  const navRoutes = getNavigationRoutes(role).filter(
    (route) => route.key !== "profile" && route.key !== "settings"
  )

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 border-r border-sidebar-border bg-sidebar md:sticky md:top-0 md:self-start md:flex md:h-screen md:flex-col",
        collapsed ? "w-[60px] p-2" : "w-[220px] p-3"
      )}
    >
      <nav className="flex-1 space-y-2">
        {navRoutes.map((route) => {
          const href = getRoutePath(route.segment)
          const isActive = pathname === href

          return (
            <Button
              key={route.key}
              asChild
              variant={isActive ? "default" : "outline"}
              className={cn(
                "w-full justify-start rounded-xl",
                collapsed ? "h-9 px-0" : "h-9",
                isActive &&
                "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
                collapsed && "justify-center px-0"
              )}
            >
              <Link href={href}>
                <NavigationIcon icon={route.icon} className={cn("size-3.5")} />
                {!collapsed ? <span>{getRouteLabel(dictionary, route.key)}</span> : null}
              </Link>
            </Button>
          )
        })}
      </nav>

      <div className="absolute top-1/2 left-full z-20 -translate-x-1/2 -translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full !border-sidebar-border !bg-sidebar !text-sidebar-foreground shadow-sm hover:!bg-sidebar-accent hover:!text-sidebar-foreground"
          onClick={onToggleCollapse}
          aria-label={collapsed ? dictionary.navigation.expand : dictionary.navigation.collapse}
        >
          <ChevronLeftIcon
            className={cn("size-4 text-sidebar-foreground transition-transform", collapsed && "rotate-180")}
          />
        </Button>
      </div>

      <SidebarUserMenu
        collapsed={collapsed}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
    </aside>
  )
}
