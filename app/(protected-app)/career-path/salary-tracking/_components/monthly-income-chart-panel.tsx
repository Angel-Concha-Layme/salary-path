"use client"

import type { SalaryHistoryChartSeries, SalaryHistoryTooltipPayload } from "@/components/charts/salary-history-chart-wrapper"
import { SalaryHistoryChartWrapper } from "@/components/charts/salary-history-chart-wrapper"

import {
  type MonthlyIncomeChartMeta,
  formatAmount,
  formatMonthKey,
} from "./personal-path-formatters"

interface MonthlyIncomeChartLabels {
  realMonthlyIncomeTitle: string
  subtitle: string
  legendTitle: string
  emptyState: string
  month: string
  final: string
  employment: string
  bonus: string
  extraIncome: string
  adjustment: string
}

interface MonthlyIncomeChartPanelProps {
  series: SalaryHistoryChartSeries<MonthlyIncomeChartMeta>[]
  showLegend: boolean
  locale: string
  labels: MonthlyIncomeChartLabels
}

function renderMonthlyTooltip(
  payload: SalaryHistoryTooltipPayload<MonthlyIncomeChartMeta>,
  locale: string,
  labels: MonthlyIncomeChartLabels
) {
  const item = payload.items[0]

  if (!item || item.meta.type !== "monthly-income") {
    return null
  }

  return (
    <div className="space-y-1">
      <p className="font-semibold">
        {labels.month}: {formatMonthKey(payload.dateKey.slice(0, 7), locale)}
      </p>
      <p>
        {labels.final}:{" "}
        {formatAmount(locale, item.meta.currency, item.meta.totals.final, 2)}
      </p>
      <p>
        {labels.employment}:{" "}
        {formatAmount(locale, item.meta.currency, item.meta.totals.employmentFinal, 2)}
      </p>
      <p>
        {labels.bonus}:{" "}
        {formatAmount(locale, item.meta.currency, item.meta.totals.bonus, 2)}
      </p>
      <p>
        {labels.extraIncome}:{" "}
        {formatAmount(locale, item.meta.currency, item.meta.totals.extraIncome, 2)}
      </p>
      <p>
        {labels.adjustment}:{" "}
        {formatAmount(locale, item.meta.currency, item.meta.totals.adjustment, 2)}
      </p>
    </div>
  )
}

export function MonthlyIncomeChartPanel({
  series,
  showLegend,
  locale,
  labels,
}: MonthlyIncomeChartPanelProps) {
  return (
    <article className="min-w-0 rounded-xl border border-border/80 bg-background">
      <header className="space-y-1.5 border-b border-border/70 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
          {labels.realMonthlyIncomeTitle}
        </h2>
        <p className="text-xs text-muted-foreground">{labels.subtitle}</p>
      </header>
      <div className="p-4">
        <SalaryHistoryChartWrapper<MonthlyIncomeChartMeta>
          view="monthly-income"
          series={series}
          height={320}
          legend={showLegend
            ? {
              title: labels.legendTitle,
              className: "mb-3 space-y-2 border-b border-border/70 pb-2",
              itemClassName: "border-border/70 bg-transparent",
            }
            : undefined}
          className="rounded-none border-0 bg-transparent p-0 shadow-none"
          chartClassName="min-w-0 w-full max-w-full"
          emptyState={labels.emptyState}
          formatters={{
            date: (dateKey) => formatMonthKey(dateKey.slice(0, 7), locale),
            value: (value, item) => formatAmount(locale, item.meta.currency, value, 2),
          }}
          tooltip={{
            render: (payload) => renderMonthlyTooltip(payload, locale, labels),
            className:
              "border-border/70 bg-background/95 shadow-lg supports-[backdrop-filter]:backdrop-blur-sm",
          }}
        />
      </div>
    </article>
  )
}
