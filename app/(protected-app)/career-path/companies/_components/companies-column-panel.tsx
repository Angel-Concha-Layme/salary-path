"use client"

import { cn } from "@/lib/utils"

interface CompaniesColumnPanelProps {
  title: string
  action?: React.ReactNode
  hideHeader?: boolean
  children: React.ReactNode
}

export function CompaniesColumnPanel({ title, action, hideHeader = false, children }: CompaniesColumnPanelProps) {
  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-transparent text-card-foreground md:rounded-xl md:border md:border-border/80 md:bg-background [&_[data-slot=input]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-slot=textarea]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-slot=input-group]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-slot=select-trigger]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-date-input-trigger=true]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)]"
    >
      {!hideHeader ? (
        <header className="flex min-h-[56px] items-center justify-between gap-3 px-1 py-2 md:min-h-[60px] md:border-b md:border-border/70 md:bg-background md:px-4 md:py-3">
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-sm md:text-foreground"
            )}
          >
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2 md:p-3">{children}</div>
    </section>
  )
}
