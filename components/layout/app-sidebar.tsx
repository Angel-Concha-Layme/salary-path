"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronLeftIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  UserCircle2Icon,
} from "lucide-react"
import { toast } from "sonner"

import type { AppRole } from "@/app/lib/auth/roles"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  getRoutePath,
  getNavigationRoutes,
} from "@/app/lib/navigation/route-config"
import { authClient } from "@/app/lib/auth/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getRouteLabel, NavigationIcon } from "@/components/layout/navigation-utils"

interface AppSidebarProps {
  role: AppRole
  userName: string
  userEmail: string
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AppSidebar({
  role,
  userName,
  userEmail,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()
  const router = useRouter()
  const navRoutes = getNavigationRoutes(role).filter((route) => route.key !== "profile")

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
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 border-r bg-sidebar md:flex md:flex-col",
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

      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-1/2 z-20 -translate-y-1/2 rounded-full !border-sidebar-border !bg-sidebar shadow-sm hover:!bg-sidebar-accent dark:!border-sidebar-border dark:!bg-sidebar dark:hover:!bg-sidebar-accent"
        onClick={onToggleCollapse}
        aria-label={collapsed ? dictionary.navigation.expand : dictionary.navigation.collapse}
      >
        <ChevronLeftIcon className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
      </Button>

      <div className="mt-auto space-y-2">
        {collapsed ? <LanguageSwitcher compact /> : null}
        {collapsed ? <ThemeSwitcher compact /> : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full rounded-xl border-sidebar-border",
                collapsed ? "h-9 justify-center px-0" : "h-10 justify-start px-2"
              )}
            >
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                <UserCircle2Icon className="size-4" />
              </span>

              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-left text-sm">
                    {userName}
                  </span>
                  <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
                </>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="right"
            sideOffset={8}
            className={cn("min-w-56", !collapsed && "w-60 min-w-60")}
          >
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                  <UserCircle2Icon className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{userName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            {!collapsed ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{dictionary.navigation.language}</DropdownMenuLabel>
                <div className="px-2 pb-2">
                  <LanguageSwitcher small />
                </div>
                <DropdownMenuLabel>{dictionary.navigation.theme}</DropdownMenuLabel>
                <div className="px-2 pb-2">
                  <ThemeSwitcher small />
                </div>
              </>
            ) : null}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={getRoutePath("/profile")}>
                <NavigationIcon icon="user" className="size-4" />
                {dictionary.navigation.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOutIcon className="size-4" />
              {dictionary.auth.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
