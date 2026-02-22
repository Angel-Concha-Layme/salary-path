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
          <div className="absolute -left-36 top-[-14%] h-[62%] w-[44%] rounded-full bg-primary/24 blur-[140px] dark:bg-primary/34" />
          <div className="absolute -left-20 top-[36%] h-[48%] w-[34%] rounded-full bg-primary/16 blur-[130px] dark:bg-primary/24" />
          <div className="absolute left-[12%] top-[16%] h-[34%] w-[24%] rounded-full bg-primary/12 blur-[110px] dark:bg-primary/18" />
        </div>

        <div className="relative z-10 flex">
          <AppSidebar
            role={role}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
          />
        </div>

        <SidebarInset className="relative z-10 h-full min-h-0 overflow-hidden lg:min-h-0">
          <main className="relative h-full min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain lg:min-h-0 lg:rounded-[1.35rem] lg:bg-background">
            {children}
          </main>
        </SidebarInset>

        <MobileBottomNav role={role} />
      </div>
    </SidebarProvider>
  )
}
