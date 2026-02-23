"use client"

import { useEffect } from "react"

import type { AppRole } from "@/app/lib/auth/roles"
import { useUserUiThemeQuery } from "@/app/hooks/settings/use-user-ui-theme"
import {
  applyUiThemeControlsStyleToElement,
  applyUiThemePresetToElement,
  coerceUiThemeControlsStyle,
  coerceUiThemePresetKey,
  getUiThemeControlsStyleFromStorage,
  getUiThemePresetFromStorage,
  setUiThemeControlsStyleInStorage,
  setUiThemePresetInStorage,
  subscribeUiThemeControlsStyle,
  subscribeUiThemePreset,
} from "@/app/lib/features/ui-theme-preset"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface AppShellProps {
  role: AppRole
  userName: string
  userEmail: string
  userImage: string | null
  children: React.ReactNode
}

const APP_SHELL_GLOW_BASE_CLASS_NAME = "h-full w-full rounded-full ui-theme-glow-base"

interface AppShellGlowPoint {
  id: string
  visibilityClassName: string
  frameClassName: string
  glowClassName: string
}

const APP_SHELL_MOBILE_GLOW_POINTS: readonly AppShellGlowPoint[] = [
  {
    id: "mobile-top-center",
    visibilityClassName: "lg:hidden",
    frameClassName: "left-1/2 top-[-18%] h-[44%] w-[82%] -translate-x-1/2",
    glowClassName: "blur-[120px] opacity-[0.38] dark:opacity-[0.50]",
  },
  {
    id: "mobile-bottom-center",
    visibilityClassName: "lg:hidden",
    frameClassName: "left-1/2 bottom-[-12%] h-[50%] w-[88%] -translate-x-1/2",
    glowClassName: "blur-[130px] opacity-[0.42] dark:opacity-[0.56]",
  },
] as const

const APP_SHELL_DESKTOP_GLOW_POINTS: readonly AppShellGlowPoint[] = [
  {
    id: "left-1",
    visibilityClassName: "hidden lg:block",
    frameClassName: "-left-44 top-[-4%] h-[62%] w-[44%]",
    glowClassName: "blur-[140px] opacity-[0.24] dark:opacity-[0.34]",
  },
  {
    id: "left-2",
    visibilityClassName: "hidden lg:block",
    frameClassName: "-left-20 top-[36%] h-[48%] w-[34%]",
    glowClassName: "blur-[130px] opacity-[0.16] dark:opacity-[0.24]",
  },
  {
    id: "left-3",
    visibilityClassName: "hidden lg:block",
    frameClassName: "left-[12%] top-[16%] h-[34%] w-[24%]",
    glowClassName: "blur-[110px] opacity-[0.12] dark:opacity-[0.18]",
  },
  {
    id: "right-1",
    visibilityClassName: "hidden lg:block",
    frameClassName: "-right-72 top-[18%] h-[72%] w-[52%]",
    glowClassName: "blur-[160px] opacity-[0.46] dark:opacity-[0.54]",
  },
] as const

export function AppShell({
  role,
  userName,
  userEmail,
  userImage,
  children,
}: AppShellProps) {
  const userUiThemeQuery = useUserUiThemeQuery()

  useEffect(() => {
    const storedThemePresetKey = getUiThemePresetFromStorage()
    const storedControlsStyle = getUiThemeControlsStyleFromStorage()
    applyUiThemePresetToElement(storedThemePresetKey)
    applyUiThemeControlsStyleToElement(storedControlsStyle)

    const unsubscribePreset = subscribeUiThemePreset((nextPresetKey) => {
      applyUiThemePresetToElement(nextPresetKey)
    })

    const unsubscribeControlsStyle = subscribeUiThemeControlsStyle((nextStyle) => {
      applyUiThemeControlsStyleToElement(nextStyle)
    })

    return () => {
      unsubscribePreset()
      unsubscribeControlsStyle()
    }
  }, [])

  useEffect(() => {
    const dbThemePresetKey = userUiThemeQuery.data?.themePresetKey
    const dbControlsStyle = userUiThemeQuery.data?.controlsStyle

    if (!dbThemePresetKey || !dbControlsStyle) {
      return
    }

    const resolvedThemePresetKey = coerceUiThemePresetKey(dbThemePresetKey)
    const resolvedControlsStyle = coerceUiThemeControlsStyle(dbControlsStyle)
    applyUiThemePresetToElement(resolvedThemePresetKey)
    applyUiThemeControlsStyleToElement(resolvedControlsStyle)

    if (getUiThemePresetFromStorage() !== resolvedThemePresetKey) {
      setUiThemePresetInStorage(resolvedThemePresetKey)
    }

    if (getUiThemeControlsStyleFromStorage() !== resolvedControlsStyle) {
      setUiThemeControlsStyleInStorage(resolvedControlsStyle)
    }
  }, [userUiThemeQuery.data?.controlsStyle, userUiThemeQuery.data?.themePresetKey])

  return (
    <SidebarProvider defaultOpen>
      <div className="relative flex h-dvh min-h-0 min-w-0 w-screen max-w-full overflow-hidden bg-sidebar lg:p-2">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {APP_SHELL_MOBILE_GLOW_POINTS.map((point) => (
            <div
              key={point.id}
              className={`absolute ${point.visibilityClassName} ${point.frameClassName}`}
            >
              <div className={`${APP_SHELL_GLOW_BASE_CLASS_NAME} ${point.glowClassName}`} />
            </div>
          ))}
          {APP_SHELL_DESKTOP_GLOW_POINTS.map((point) => (
            <div
              key={point.id}
              className={`absolute ${point.visibilityClassName} ${point.frameClassName}`}
            >
              <div className={`${APP_SHELL_GLOW_BASE_CLASS_NAME} ${point.glowClassName}`} />
            </div>
          ))}
        </div>

        <div className="relative z-10 flex">
          <AppSidebar
            role={role}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
          />
        </div>

        <SidebarInset className="relative z-10 h-full min-h-0 overflow-hidden p-[5px] lg:min-h-0">
          <main className="relative h-full min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-[1.35rem] bg-background lg:min-h-0">
            {children}
          </main>
        </SidebarInset>

        <MobileBottomNav role={role} />
      </div>
    </SidebarProvider>
  )
}
