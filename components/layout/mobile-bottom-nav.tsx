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
} from "@/app/lib/navigation/route-config"
import { authClient } from "@/app/lib/auth/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()
  const router = useRouter()
  const primaryRoutes = getMobilePrimaryRoutes(role)
  const secondaryRoutes = getNavigationRoutes(role).filter(
    (route) => !route.mobilePrimary
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-2 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2">
        {primaryRoutes.map((route) => {
          const href = getRoutePath(route.segment)
          const isActive = pathname === href

          return (
            <Button
              key={route.key}
              asChild
              variant={isActive ? "default" : "outline"}
              size="icon"
              className={cn("size-11 rounded-xl")}
            >
              <Link href={href} aria-label={getRouteLabel(dictionary, route.key)}>
                <NavigationIcon icon={route.icon} className="size-4" />
              </Link>
            </Button>
          )
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-11 rounded-xl">
              <MenuIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            {secondaryRoutes.map((route) => (
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
  )
}
