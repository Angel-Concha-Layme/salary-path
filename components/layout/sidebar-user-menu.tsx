"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  UserCircle2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/app/lib/auth/client"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { getRoutePath } from "@/app/lib/navigation/route-config"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { NavigationIcon } from "@/components/layout/navigation-utils"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface SidebarUserMenuProps {
  collapsed: boolean
  userName: string
  userEmail: string
  userImage: string | null
}

function isPathWithinSection(pathname: string, sectionPath: string): boolean {
  return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`)
}

function SidebarAvatar({
  userImage,
  userName,
  sizeClassName,
  iconClassName,
}: {
  userImage: string | null
  userName: string
  sizeClassName: string
  iconClassName: string
}) {
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null)
  const showImage = Boolean(userImage && failedImageSrc !== userImage)

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-sidebar-accent text-sidebar-accent-foreground",
        sizeClassName
      )}
    >
      {showImage ? (
        <img
          src={userImage ?? ""}
          alt={userName}
          className="size-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageSrc(userImage)}
        />
      ) : (
        <UserCircle2Icon className={iconClassName} />
      )}
    </span>
  )
}

export function SidebarUserMenu({
  collapsed,
  userName,
  userEmail,
  userImage,
}: SidebarUserMenuProps) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()
  const router = useRouter()
  const profilePath = getRoutePath("/profile")
  const settingsPath = getRoutePath("/settings")
  const profileActive = isPathWithinSection(pathname, profilePath)
  const settingsActive = isPathWithinSection(pathname, settingsPath)
  const entrypointActive = profileActive || settingsActive

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
    <div className="mt-auto space-y-2">
      {collapsed ? <LanguageSwitcher compact tone="sidebar" /> : null}
      {collapsed ? <ThemeSwitcher compact tone="sidebar" /> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full rounded-xl",
              collapsed ? "h-9 justify-center px-0" : "h-10 justify-start px-2",
              [
                "border border-transparent bg-transparent shadow-none",
                !entrypointActive && "text-sidebar-foreground hover:bg-sidebar-accent/40",
                entrypointActive &&
                  "border-sidebar-primary/45 bg-sidebar-primary/12 text-sidebar-foreground ring-1 ring-sidebar-primary/35 shadow-sm shadow-sidebar-primary/20 hover:bg-sidebar-primary/18",
              ],
            )}
          >
            <SidebarAvatar
              userImage={userImage}
              userName={userName}
              sizeClassName="size-7"
              iconClassName="size-4"
            />

            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1 truncate text-left text-sm">
                  {userName}
                </span>
                <ChevronsUpDownIcon
                  className={cn(
                    "size-3.5",
                    entrypointActive
                      ? "text-sidebar-foreground"
                      : "text-muted-foreground"
                  )}
                />
              </>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="right"
          sideOffset={8}
          className={cn(
            "min-w-56 border-sidebar-border bg-sidebar text-sidebar-foreground ring-sidebar-ring/30",
            !collapsed && "w-60 min-w-60"
          )}
        >
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="flex items-center gap-1.5">
              <SidebarAvatar
                userImage={userImage}
                userName={userName}
                sizeClassName="size-7"
                iconClassName="size-3.5"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {userName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/70">
                  {userEmail}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          {!collapsed ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{dictionary.navigation.language}</DropdownMenuLabel>
              <div className="px-2 pb-2">
                <LanguageSwitcher small tone="sidebar" />
              </div>
              <DropdownMenuLabel>{dictionary.navigation.theme}</DropdownMenuLabel>
              <div className="px-2 pb-2">
                <ThemeSwitcher small tone="sidebar" />
              </div>
            </>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={cn(
              "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
              profileActive &&
                "bg-sidebar-primary/12 text-sidebar-foreground ring-1 ring-sidebar-primary/35 shadow-sm shadow-sidebar-primary/20"
            )}
            asChild
          >
            <Link href={profilePath}>
              <NavigationIcon icon="user" className="size-4" />
              {dictionary.navigation.profile}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(
              "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
              settingsActive &&
                "bg-sidebar-primary/12 text-sidebar-foreground ring-1 ring-sidebar-primary/35 shadow-sm shadow-sidebar-primary/20"
            )}
            asChild
          >
            <Link href={settingsPath}>
              <NavigationIcon icon="settings" className="size-4" />
              {dictionary.navigation.settings}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOutIcon className="size-4" />
            {dictionary.auth.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
