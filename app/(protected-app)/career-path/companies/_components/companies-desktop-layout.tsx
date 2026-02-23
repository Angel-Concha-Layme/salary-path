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
    <div className="grid gap-4 md:h-full md:min-h-0 md:grid-cols-3 md:items-stretch">
      {state.companiesPanel}
      {state.eventsPanel}
      {state.detailsPanel}
    </div>
  )
}
