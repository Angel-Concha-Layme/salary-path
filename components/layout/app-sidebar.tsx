"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDownIcon, PanelLeftIcon } from "lucide-react"

import type { AppRole } from "@/app/lib/auth/roles"
import {
  DEFAULT_SIDEBAR_GROUP_BEHAVIOR,
  getSidebarGroupBehaviorFromStorage,
  subscribeSidebarGroupBehavior,
  type SidebarGroupBehavior,
} from "@/app/lib/features/sidebar-group-behavior"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  getNavigationGroups,
  type RouteGroupKey,
  getRoutePath,
} from "@/app/lib/navigation/route-config"
import {
  getNavigationGroupLabel,
  getRouteLabel,
  NavigationIcon,
} from "@/components/layout/navigation-utils"
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  role: AppRole
  userName: string
  userEmail: string
  userImage: string | null
}

function isPathWithinSection(pathname: string, sectionPath: string): boolean {
  return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`)
}

export function AppSidebar({
  role,
  userName,
  userEmail,
  userImage,
}: AppSidebarProps) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const brandLabel = dictionary.exploreLanding.title
  const brandCompactLabel = brandLabel
    .split(/\s+/)
    .map((segment) => segment[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CP"
  const toggleLabel = collapsed
    ? dictionary.navigation.expandSidebar
    : dictionary.navigation.collapseSidebar
  const navigationGroups = getNavigationGroups(role)
  const [groupBehavior, setGroupBehavior] = useState<SidebarGroupBehavior>(
    DEFAULT_SIDEBAR_GROUP_BEHAVIOR
  )
  const activeGroupKey =
    navigationGroups.find((group) =>
      group.routes.some((route) => isPathWithinSection(pathname, getRoutePath(route.segment)))
    )?.key ?? null
  const [groupExpandedOverrides, setGroupExpandedOverrides] = useState<
    Partial<Record<RouteGroupKey, boolean>>
  >({})

  useEffect(() => {
    queueMicrotask(() => {
      setGroupBehavior(getSidebarGroupBehaviorFromStorage())
      setGroupExpandedOverrides({})
    })

    return subscribeSidebarGroupBehavior((nextBehavior) => {
      setGroupBehavior(nextBehavior)
      setGroupExpandedOverrides({})
    })
  }, [])

  const isGroupExpandedByDefault = (groupKey: RouteGroupKey) =>
    groupBehavior === "all_expanded" || groupKey === activeGroupKey

  const groupedRoutes = navigationGroups.map((group, index) => ({
    ...group,
    index,
    label: getNavigationGroupLabel(dictionary, group.key),
    expanded: groupExpandedOverrides[group.key] ?? isGroupExpandedByDefault(group.key),
  }))

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className={cn(
        "lg:h-full lg:rounded-[1.15rem] lg:!border-0 lg:!border-r-0 lg:!bg-transparent lg:shadow-none",
      )}
    >
      <SidebarHeader
        className={cn(
          "!border-b-0",
          collapsed ? "px-1 py-2" : "px-2.5 py-2.5"
        )}
      >
        <div className={cn("flex items-center", collapsed ? "gap-1" : "gap-2")}>
          <Link
            href="/home"
            aria-label={dictionary.navigation.home}
            className={cn(
              "inline-flex h-8 items-center border-0 bg-black text-white shadow-none",
              collapsed ? "h-6 w-6 justify-center rounded-lg px-0" : "w-full justify-start rounded-xl px-3"
            )}
          >
            <span
              className={cn(
                "font-semibold leading-none tracking-[0.14em] uppercase text-white",
                collapsed ? "text-[9px] tracking-[0.09em]" : "text-[11px]"
              )}
            >
              {collapsed ? brandCompactLabel : brandLabel}
            </span>
          </Link>
          <button
            type="button"
            aria-label={toggleLabel}
            onClick={toggleSidebar}
            className={cn(
              "ml-auto hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-sidebar-foreground shadow-none transition-none hover:bg-transparent focus-visible:bg-transparent lg:inline-flex",
              collapsed && "h-6 w-6 rounded-lg"
            )}
          >
            <PanelLeftIcon className="size-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {groupedRoutes.map((group) => (
          <SidebarGroup
            key={group.key}
            className={cn(
              "space-y-2 py-0",
              group.index === 0
                ? "pt-1.5"
                : "mt-2.5 border-t border-sidebar-border/80 pt-2.5"
            )}
          >
            {!collapsed ? (
              <button
                type="button"
                onClick={() =>
                  setGroupExpandedOverrides((current) => ({
                    ...current,
                    [group.key]:
                      !(
                        current[group.key] ??
                        isGroupExpandedByDefault(group.key)
                      ),
                  }))
                }
                aria-label={`${group.expanded ? dictionary.navigation.collapse : dictionary.navigation.expand} ${group.label}`}
                className="flex w-full items-center gap-2 rounded-md px-1 text-left hover:bg-sidebar-accent/70"
              >
                <span className="px-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {group.label}
                </span>
                <ChevronDownIcon
                  className={cn(
                    "ml-auto size-3.5 text-muted-foreground transition-transform",
                    group.expanded ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
            ) : null}

            <SidebarGroupContent
              className={cn(!collapsed && !group.expanded && "hidden")}
            >
              <SidebarMenu>
                {group.routes.map((route) => {
                  const href = getRoutePath(route.segment)
                  const isActive = isPathWithinSection(pathname, href)
                  const label = getRouteLabel(dictionary, route.key)

                  return (
                    <SidebarMenuItem key={route.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          collapsed ? "justify-center px-0" : "justify-start",
                          [
                            "h-8 rounded-lg !border-0 text-[13px]",
                            "hover:bg-sidebar-accent/70",
                            "[&[data-active=true]]:!border-0",
                            "[&[data-active=true]]:bg-white",
                            "[&[data-active=true]]:text-black",
                            "dark:[&[data-active=true]]:bg-white",
                            "dark:[&[data-active=true]]:text-black",
                          ]
                        )}
                      >
                        <Link
                          href={href}
                          aria-label={label}
                          className={cn("flex min-w-0 items-center gap-2")}
                        >
                          <NavigationIcon icon={route.icon} className="size-3.5" />
                          {!collapsed ? <span className="truncate">{label}</span> : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="!border-t-0">
        <SidebarUserMenu
          collapsed={collapsed}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
