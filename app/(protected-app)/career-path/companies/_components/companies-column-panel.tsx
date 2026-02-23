"use client"

import { cn } from "@/lib/utils"

interface CompaniesColumnPanelProps {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function CompaniesColumnPanel({ title, action, children }: CompaniesColumnPanelProps) {
  return (
    <section className="flex min-h-[500px] flex-col rounded-xl border border-border/80 bg-background text-card-foreground">
      <header className="flex min-h-[60px] items-center justify-between gap-3 border-b border-border/70 bg-background px-4 py-3">
        <h2 className={cn("text-sm font-semibold uppercase tracking-[0.12em] text-foreground")}>{title}</h2>
        {action}
      </header>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  )
}
