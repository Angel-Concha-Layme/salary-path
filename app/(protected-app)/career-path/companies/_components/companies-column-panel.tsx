"use client"

import { cn } from "@/lib/utils"

interface CompaniesColumnPanelProps {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function CompaniesColumnPanel({ title, action, children }: CompaniesColumnPanelProps) {
  return (
    <section
      className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-border/80 bg-background text-card-foreground md:h-full md:min-h-0 [&_[data-slot=input]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-slot=textarea]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-slot=input-group]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-slot=select-trigger]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)] [&_[data-date-input-trigger=true]:hover]:bg-[color-mix(in_oklch,var(--ui-accent-current)_10%,transparent)]"
    >
      <header className="flex min-h-[60px] items-center justify-between gap-3 border-b border-border/70 bg-background px-4 py-3">
        <h2 className={cn("text-sm font-semibold uppercase tracking-[0.12em] text-foreground")}>{title}</h2>
        {action}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </section>
  )
}
