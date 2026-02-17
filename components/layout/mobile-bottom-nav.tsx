"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MenuIcon } from "lucide-react"
import { toast } from "sonner"

import type { AppRole } from "@/app/lib/auth/roles"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  getRoutePath,
  getMobilePrimaryRoutes,
  getNavigationRoutes,
  type RouteKey,
} from "@/app/lib/navigation/route-config"
import { authClient } from "@/app/lib/auth/client"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getRouteLabel, NavigationIcon } from "@/components/layout/navigation-utils"

interface MobileBottomNavProps {
  role: AppRole
}

const MOBILE_PRIMARY_ORDER: readonly RouteKey[] = [
  "personalPath",
  "companies",
  "profile",
  "comparison",
]

function isPathWithinSection(pathname: string, sectionPath: string): boolean {
  return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`)
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()
  const router = useRouter()
  const allPrimaryRoutes = getMobilePrimaryRoutes(role)
  const primaryRoutes = MOBILE_PRIMARY_ORDER.map((key) =>
    allPrimaryRoutes.find((route) => route.key === key)
  ).filter((route): route is (typeof allPrimaryRoutes)[number] => Boolean(route))
  const secondaryRoutes = getNavigationRoutes(role).filter(
    (route) => !route.mobilePrimary
  )
  const orderedSecondaryRoutes = [
    ...secondaryRoutes.filter((route) => route.key === "settings"),
    ...secondaryRoutes.filter((route) => route.key !== "settings"),
  ]
  const isSecondaryActive = orderedSecondaryRoutes.some((route) =>
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
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
      <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-border/70 bg-background/90 px-1.5 py-1 shadow-lg backdrop-blur">
        <div className="grid w-full grid-cols-5 items-stretch">
          {primaryRoutes.map((route) => {
            const href = getRoutePath(route.segment)
            const isActive = isPathWithinSection(pathname, href)
            const label = getRouteLabel(dictionary, route.key)

            return (
              <Link
                key={route.key}
                href={href}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] leading-tight transition-colors",
                  isActive
                    ? "bg-muted/60 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 left-2 right-2 h-0.5 rounded-full transition-opacity",
                    isActive ? "bg-primary opacity-100" : "opacity-0"
                  )}
                />
                <NavigationIcon icon={route.icon} className="size-4" />
                <span className="text-center">{label}</span>
              </Link>
            )
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] leading-tight transition-colors",
                  isSecondaryActive
                    ? "bg-muted/60 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={`${dictionary.navigation.menu}: ${dictionary.navigation.settings} / ${dictionary.auth.signOut}`}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 left-2 right-2 h-0.5 rounded-full transition-opacity",
                    isSecondaryActive ? "bg-primary opacity-100" : "opacity-0"
                  )}
                />
                <MenuIcon className="size-4" />
                <span className="text-center">{dictionary.navigation.menu}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              {orderedSecondaryRoutes.map((route) => (
                <DropdownMenuItem key={route.key} asChild>
                  <Link href={getRoutePath(route.segment)}>
                    <NavigationIcon icon={route.icon} className="size-4" />
                    {getRouteLabel(dictionary, route.key)}
                  </Link>
                </DropdownMenuItem>
              ))}
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
