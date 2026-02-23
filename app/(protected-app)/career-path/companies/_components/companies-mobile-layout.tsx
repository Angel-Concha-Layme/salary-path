"use client"

import type { ScreenLayoutProps } from "@/app/lib/features/breakpoints"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CompaniesMobileTab = "companies" | "events" | "details"

interface CompaniesMobileLayoutState {
  activeTab: CompaniesMobileTab
  companiesPanel: React.ReactNode
  eventsPanel: React.ReactNode
  detailsPanel: React.ReactNode
  tabLabels: {
    companies: string
    events: string
    details: string
  }
}

interface CompaniesMobileLayoutActions {
  onTabChange: (tab: CompaniesMobileTab) => void
}

type CompaniesMobileLayoutProps = ScreenLayoutProps<CompaniesMobileLayoutState, CompaniesMobileLayoutActions>

export function CompaniesMobileLayout({
  state,
  actions,
}: CompaniesMobileLayoutProps) {
  const { activeTab, companiesPanel, eventsPanel, detailsPanel, tabLabels } = state
  const activePanel =
    activeTab === "companies" ? companiesPanel : activeTab === "events" ? eventsPanel : detailsPanel

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/80 bg-card p-2 shadow-sm">
        <Button
          type="button"
          variant={activeTab === "companies" ? "default" : "outline"}
          size="sm"
          className={cn(
            activeTab === "companies" &&
              "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          )}
          onClick={() => actions.onTabChange("companies")}
        >
          {tabLabels.companies}
        </Button>
        <Button
          type="button"
          variant={activeTab === "events" ? "default" : "outline"}
          size="sm"
          className={cn(
            activeTab === "events" &&
              "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          )}
          onClick={() => actions.onTabChange("events")}
        >
          {tabLabels.events}
        </Button>
        <Button
          type="button"
          variant={activeTab === "details" ? "default" : "outline"}
          size="sm"
          className={cn(
            activeTab === "details" &&
              "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
          )}
          onClick={() => actions.onTabChange("details")}
        >
          {tabLabels.details}
        </Button>
      </div>

      <div>{activePanel}</div>
    </div>
  )
}
