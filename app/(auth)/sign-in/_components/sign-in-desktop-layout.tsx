"use client"

import type { ScreenLayoutProps } from "@/app/lib/features/breakpoints"

interface SignInDesktopLayoutState {
  authPanel: React.ReactNode
  heroPanel: React.ReactNode
}

type SignInDesktopLayoutProps = ScreenLayoutProps<SignInDesktopLayoutState>

export function SignInDesktopLayout({ state }: SignInDesktopLayoutProps) {
  return (
    <section className="min-h-screen w-full bg-background lg:grid lg:grid-cols-[minmax(360px,0.38fr)_minmax(0,0.62fr)]">
      <div className="flex items-center justify-center bg-muted/35 px-6 py-10 sm:px-10 lg:px-10 xl:px-16">
        <div className="w-full max-w-md">{state.authPanel}</div>
      </div>

      <aside className="flex items-center justify-center bg-background p-4 xl:p-6">{state.heroPanel}</aside>
    </section>
  )
}
