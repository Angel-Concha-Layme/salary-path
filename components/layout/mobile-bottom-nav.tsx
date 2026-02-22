"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MenuIcon } from "lucide-react"
import { toast } from "sonner"

import type { AppRole } from "@/app/lib/auth/roles"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  getMobileMenuRoutes,
  getNavigationGroups,
  getNavigationRoutes,
  getRoutePath,
  type AppRouteDefinition,
} from "@/app/lib/navigation/route-config"
import { authClient } from "@/app/lib/auth/client"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getNavigationGroupLabel,
  getRouteLabel,
  NavigationIcon,
} from "@/components/layout/navigation-utils"

interface MobileBottomNavProps {
  role: AppRole
}

function isPathWithinSection(pathname: string, sectionPath: string): boolean {
  return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`)
}

function getRequiredRoute(
  routes: AppRouteDefinition[],
  key: AppRouteDefinition["key"]
): AppRouteDefinition {
  const route = routes.find((item) => item.key === key)

  if (!route) {
    throw new Error(`Missing route definition for key: ${key}`)
  }

  return route
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()
  const router = useRouter()

  const navigationRoutes = getNavigationRoutes(role)
  const careerEntryRoute = getRequiredRoute(navigationRoutes, "personalPath")
  const financialEntryRoute = getRequiredRoute(navigationRoutes, "taxesPeru")
  const homeEntryRoute = getRequiredRoute(navigationRoutes, "mortgageEligibility")
  const profileRoute = getRequiredRoute(navigationRoutes, "profile")

  const primaryTabs = [
    {
      key: "careerPath",
      href: getRoutePath(careerEntryRoute.segment),
      label: dictionary.navigation.careerPath,
      icon: careerEntryRoute.icon,
      isActive: pathname.startsWith("/career-path"),
    },
    {
      key: "financialEngine",
      href: getRoutePath(financialEntryRoute.segment),
      label: dictionary.navigation.financialEngine,
      icon: financialEntryRoute.icon,
      isActive: pathname.startsWith("/financial-engine"),
    },
    {
      key: "homePath",
      href: getRoutePath(homeEntryRoute.segment),
      label: dictionary.navigation.homePath,
      icon: homeEntryRoute.icon,
      isActive: pathname.startsWith("/home-path"),
    },
    {
      key: "profile",
      href: getRoutePath(profileRoute.segment),
      label: getRouteLabel(dictionary, "profile"),
      icon: profileRoute.icon,
      isActive: isPathWithinSection(pathname, getRoutePath(profileRoute.segment)),
    },
  ] as const

  const menuRoutes = getMobileMenuRoutes(role)
  const menuGroups = getNavigationGroups(role)
    .map((group) => ({
      key: group.key,
      routes: group.routes.filter((route) => route.showInMobileMenu),
    }))
    .filter((group) => group.routes.length > 0)

  const menuActiveRoutes = menuRoutes.filter(
    (route) => route.group === "account" || route.group === "admin"
  )
  const isMenuActive = menuActiveRoutes.some((route) =>
    isPathWithinSection(pathname, getRoutePath(route.segment))
  )

  async function handleSignOut() {
    const result = await authClient.signOut()

    if (result.error) {
      toast.error(result.error.message ?? dictionary.common.unknownError)
      return
    }

    router.push("/sign-in")
    router.refresh()
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden">
      <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-border/70 bg-background/90 px-1.5 py-1 shadow-lg backdrop-blur">
        <div className="grid w-full grid-cols-5 items-stretch">
          {primaryTabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-label={tab.label}
              aria-current={tab.isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] leading-tight transition-colors",
                tab.isActive
                  ? "bg-muted/60 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0 left-2 right-2 h-0.5 rounded-full transition-opacity",
                  tab.isActive ? "bg-primary opacity-100" : "opacity-0"
                )}
              />
              <NavigationIcon icon={tab.icon} className="size-4" />
              <span className="text-center">{tab.label}</span>
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] leading-tight transition-colors",
                  isMenuActive
                    ? "bg-muted/60 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={`${dictionary.navigation.menu}: ${dictionary.navigation.settings} / ${dictionary.auth.signOut}`}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 left-2 right-2 h-0.5 rounded-full transition-opacity",
                    isMenuActive ? "bg-primary opacity-100" : "opacity-0"
                  )}
                />
                <MenuIcon className="size-4" />
                <span className="text-center">{dictionary.navigation.menu}</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="end" className="w-64">
              {menuGroups.map((group, groupIndex) => (
                <div key={group.key}>
                  {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuLabel>{getNavigationGroupLabel(dictionary, group.key)}</DropdownMenuLabel>
                  {group.routes.map((route) => (
                    <DropdownMenuItem key={route.key} asChild>
                      <Link href={getRoutePath(route.segment)}>
                        <NavigationIcon icon={route.icon} className="size-4" />
                        {getRouteLabel(dictionary, route.key)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                {dictionary.auth.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
