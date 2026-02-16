"use client"

import { useState } from "react"

import type { AppRole } from "@/app/lib/auth/roles"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <AppSidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />

        <main className="min-h-screen w-full pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-6xl p-6 md:p-8">{children}</div>
        </main>
      </div>

      <MobileBottomNav role={role} />
    </div>
  )
}
