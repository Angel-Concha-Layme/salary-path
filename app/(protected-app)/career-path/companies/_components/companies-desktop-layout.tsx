"use client"

import type { ScreenLayoutProps } from "@/app/lib/features/breakpoints"

interface CompaniesDesktopLayoutState {
  companiesPanel: React.ReactNode
  eventsPanel: React.ReactNode
  detailsPanel: React.ReactNode
}

type CompaniesDesktopLayoutProps = ScreenLayoutProps<CompaniesDesktopLayoutState>

export function CompaniesDesktopLayout({ state }: CompaniesDesktopLayoutProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {state.companiesPanel}
      {state.eventsPanel}
      {state.detailsPanel}
    </div>
  )
}
