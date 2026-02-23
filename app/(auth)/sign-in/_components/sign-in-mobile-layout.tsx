"use client"

import type { ScreenLayoutProps } from "@/app/lib/features/breakpoints"

interface SignInMobileLayoutState {
  authPanel: React.ReactNode
}

type SignInMobileLayoutProps = ScreenLayoutProps<SignInMobileLayoutState>

export function SignInMobileLayout({ state }: SignInMobileLayoutProps) {
  return (
    <section className="min-h-screen w-full bg-background">
      <div className="flex items-center justify-center bg-muted/35 px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">{state.authPanel}</div>
      </div>
    </section>
  )
}
