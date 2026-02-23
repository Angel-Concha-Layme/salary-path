"use client"

import type { AppRole } from "@/app/lib/auth/roles"
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

export const APP_SHELL_GLOW_BASE_COLOR_CLASS_NAME = "bg-primary"

const APP_SHELL_GLOW_BASE_CLASS_NAME = "absolute rounded-full"

const APP_SHELL_LEFT_GLOW_DETAIL_CLASS_NAMES = [
  "-left-44 top-[-4%] h-[62%] w-[44%] blur-[140px] opacity-[0.24] dark:opacity-[0.34]",
  "-left-20 top-[36%] h-[48%] w-[34%] blur-[130px] opacity-[0.16] dark:opacity-[0.24]",
  "left-[12%] top-[16%] h-[34%] w-[24%] blur-[110px] opacity-[0.12] dark:opacity-[0.18]",
] as const

const APP_SHELL_RIGHT_GLOW_DETAIL_CLASS_NAMES = [
  "-right-72 top-[18%] h-[72%] w-[52%] blur-[160px] opacity-[0.46] dark:opacity-[0.54]",
] as const

export function AppShell({
  role,
  userName,
  userEmail,
  userImage,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="relative flex h-dvh min-h-0 min-w-0 w-screen max-w-full overflow-hidden bg-sidebar lg:p-2">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {APP_SHELL_LEFT_GLOW_DETAIL_CLASS_NAMES.map((className) => (
            <div
              key={`left-${className}`}
              className={`${APP_SHELL_GLOW_BASE_CLASS_NAME} ${APP_SHELL_GLOW_BASE_COLOR_CLASS_NAME} ${className}`}
            />
          ))}
          {APP_SHELL_RIGHT_GLOW_DETAIL_CLASS_NAMES.map((className) => (
            <div
              key={`right-${className}`}
              className={`${APP_SHELL_GLOW_BASE_CLASS_NAME} ${APP_SHELL_GLOW_BASE_COLOR_CLASS_NAME} ${className}`}
            />
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
          <main className="relative h-full min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain lg:min-h-0 lg:rounded-[1.35rem] lg:bg-background">
            {children}
          </main>
        </SidebarInset>

        <MobileBottomNav role={role} />
      </div>
    </SidebarProvider>
  )
}
