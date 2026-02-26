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
  floatingAction?: React.ReactNode
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
  const { activeTab, companiesPanel, eventsPanel, detailsPanel, floatingAction, tabLabels } = state
  const activePanel =
    activeTab === "companies" ? companiesPanel : activeTab === "events" ? eventsPanel : detailsPanel

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col rounded-2xl border border-border/80 bg-card/35 p-2 text-card-foreground backdrop-blur-[1px] transition-colors hover:border-[color-mix(in_oklch,var(--ui-accent-current)_40%,var(--border))] hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_8%,var(--card))]">
      <div className="sticky top-0 z-10 border-b border-border/70 bg-[color-mix(in_oklch,var(--card)_82%,transparent)] pb-2 backdrop-blur-[2px]">
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-background/70 p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-lg border border-transparent text-sm font-semibold uppercase tracking-[0.11em]",
              activeTab === "companies"
                ? "border-[color-mix(in_oklch,var(--ui-accent-current)_44%,var(--border))] bg-[color-mix(in_oklch,var(--ui-accent-current)_64%,black)] text-white shadow-sm"
                : "text-muted-foreground hover:border-[color-mix(in_oklch,var(--ui-accent-current)_34%,var(--border))] hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_12%,var(--background))] hover:text-foreground"
            )}
            onClick={() => actions.onTabChange("companies")}
          >
            {tabLabels.companies}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-lg border border-transparent text-sm font-semibold uppercase tracking-[0.11em]",
              activeTab === "events"
                ? "border-[color-mix(in_oklch,var(--ui-accent-current)_44%,var(--border))] bg-[color-mix(in_oklch,var(--ui-accent-current)_64%,black)] text-white shadow-sm"
                : "text-muted-foreground hover:border-[color-mix(in_oklch,var(--ui-accent-current)_34%,var(--border))] hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_12%,var(--background))] hover:text-foreground"
            )}
            onClick={() => actions.onTabChange("events")}
          >
            {tabLabels.events}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-lg border border-transparent text-sm font-semibold uppercase tracking-[0.11em]",
              activeTab === "details"
                ? "border-[color-mix(in_oklch,var(--ui-accent-current)_44%,var(--border))] bg-[color-mix(in_oklch,var(--ui-accent-current)_64%,black)] text-white shadow-sm"
                : "text-muted-foreground hover:border-[color-mix(in_oklch,var(--ui-accent-current)_34%,var(--border))] hover:bg-[color-mix(in_oklch,var(--ui-accent-current)_12%,var(--background))] hover:text-foreground"
            )}
            onClick={() => actions.onTabChange("details")}
          >
            {tabLabels.details}
          </Button>
        </div>
      </div>

      <div className={cn("relative min-h-0 flex-1 overflow-hidden pt-2", floatingAction && "pb-14")}>
        {activePanel}
        {floatingAction ? (
          <div className="pointer-events-none absolute right-3 bottom-3 z-20">
            <div className="pointer-events-auto">{floatingAction}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
