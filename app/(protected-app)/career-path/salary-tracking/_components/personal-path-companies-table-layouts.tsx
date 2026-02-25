"use client"

import type { CSSProperties } from "react"
import { useMemo, useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { PersonalPathCompanyTableRow } from "@/app/lib/models/personal-path/personal-path-chart.model"
import { cn } from "@/lib/utils"

export interface PersonalPathCompaniesTableLabels {
  displayName: string
  roleDisplayName: string
  startDate: string
  endDate: string
  monthlyAverageSalary: string
  annualSalary: string
}

interface PersonalPathCompaniesTableBaseLayoutProps {
  rows: PersonalPathCompanyTableRow[]
  locale: string
  labels: PersonalPathCompaniesTableLabels
  notAvailableLabel: string
}

interface PersonalPathCompaniesTableDesktopLayoutProps
  extends PersonalPathCompaniesTableBaseLayoutProps {
  activeCompanyId: string | null
  onSelectCompany: (companyId: string) => void
}

interface PersonalPathCompaniesTableMobileLayoutProps
  extends PersonalPathCompaniesTableBaseLayoutProps {
  eventsByCompanyId: Map<string, PathCompanyEventsEntity[]>
  eventTypeLabels: Record<string, string>
  eventsTitle: string
  noEventsLabel: string
  defaultExpanded?: boolean
}

function formatDateValue(value: string | null, locale: string): string {
  if (!value) {
    return "—"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function formatAmount(
  locale: string,
  currency: string,
  amount: number,
  maximumFractionDigits: number
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(amount)
  } catch {
    return `${amount.toFixed(maximumFractionDigits)} ${currency}`
  }
}

function getMonthlyAverageSalaryValue(
  row: PersonalPathCompanyTableRow,
  locale: string,
  notAvailableLabel: string
): string {
  if (row.monthlyAverageSalary === null) {
    return notAvailableLabel
  }

  return formatAmount(locale, row.currency, row.monthlyAverageSalary, 2)
}

function getAnnualSalaryValue(
  row: PersonalPathCompanyTableRow,
  locale: string,
  notAvailableLabel: string
): string {
  if (row.annualSalary === null) {
    return notAvailableLabel
  }

  return formatAmount(locale, row.currency, row.annualSalary, 0)
}

function hexToRgb(hexColor: string): { red: number; green: number; blue: number } | null {
  const normalized = hexColor.trim().replace("#", "")

  if (![3, 6].includes(normalized.length)) {
    return null
  }

  const expanded = normalized.length === 3
    ? normalized.split("").map((segment) => `${segment}${segment}`).join("")
    : normalized

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return null
  }

  return { red, green, blue }
}

function getCompanyCardStyle(hexColor: string): CSSProperties | undefined {
  const rgb = hexToRgb(hexColor)

  if (!rgb) {
    return undefined
  }

  return {
    backgroundColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.10)`,
  }
}

export function PersonalPathCompaniesTableDesktopLayout({
  rows,
  activeCompanyId,
  locale,
  labels,
  notAvailableLabel,
  onSelectCompany,
}: PersonalPathCompaniesTableDesktopLayoutProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-background text-xs uppercase tracking-[0.08em] text-foreground">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.displayName}</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.roleDisplayName}</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.startDate}</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.endDate}</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.monthlyAverageSalary}</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.annualSalary}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = row.id === activeCompanyId

            return (
              <tr
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCompany(row.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onSelectCompany(row.id)
                  }
                }}
                className={cn(
                  "cursor-pointer border-t border-border/70 align-top text-sm text-foreground transition-colors hover:bg-accent/40",
                  isSelected && "bg-background"
                )}
                aria-label={`${labels.displayName}: ${row.displayName}`}
              >
                <td className={cn("whitespace-nowrap px-3 py-2 font-medium", isSelected && "text-foreground")}>
                  {row.displayName}
                </td>
                <td className={cn("whitespace-nowrap px-3 py-2", isSelected && "text-foreground")}>
                  {row.roleDisplayName}
                </td>
                <td className={cn("whitespace-nowrap px-3 py-2", isSelected && "text-foreground")}>
                  {formatDateValue(row.startDate, locale)}
                </td>
                <td className={cn("whitespace-nowrap px-3 py-2", isSelected && "text-foreground")}>
                  {formatDateValue(row.endDate, locale)}
                </td>
                <td className={cn("whitespace-nowrap px-3 py-2", isSelected && "text-foreground")}>
                  {getMonthlyAverageSalaryValue(row, locale, notAvailableLabel)}
                </td>
                <td className={cn("whitespace-nowrap px-3 py-2", isSelected && "text-foreground")}>
                  {getAnnualSalaryValue(row, locale, notAvailableLabel)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function PersonalPathCompaniesTableMobileLayout({
  rows,
  locale,
  labels,
  notAvailableLabel,
  eventsByCompanyId,
  eventTypeLabels,
  eventsTitle,
  noEventsLabel,
  defaultExpanded = true,
}: PersonalPathCompaniesTableMobileLayoutProps) {
  const [collapsedCompanyIds, setCollapsedCompanyIds] = useState<string[]>(
    () => (defaultExpanded ? [] : rows.map((row) => row.id))
  )

  const sortedEventsByCompanyId = useMemo(() => {
    const sortedMap = new Map<string, PathCompanyEventsEntity[]>()

    eventsByCompanyId.forEach((events, companyId) => {
      sortedMap.set(
        companyId,
        [...events].sort(
          (left, right) =>
            new Date(right.effectiveDate).getTime() - new Date(left.effectiveDate).getTime()
        )
      )
    })

    return sortedMap
  }, [eventsByCompanyId])

  return (
    <div className="space-y-1 px-1 py-1">
      {rows.map((row) => {
        const isExpanded = !collapsedCompanyIds.includes(row.id)
        const monthlyAverageSalary = getMonthlyAverageSalaryValue(row, locale, notAvailableLabel)
        const annualSalary = getAnnualSalaryValue(row, locale, notAvailableLabel)
        const companyCardStyle = getCompanyCardStyle(row.color)
        const companyEvents = sortedEventsByCompanyId.get(row.id) ?? []

        return (
          <article
            key={row.id}
            className={cn(
              "rounded-lg border border-border/70 px-2 py-2 transition-colors",
              isExpanded && "bg-accent/15"
            )}
            style={companyCardStyle}
          >
            <button
              type="button"
              onClick={() => {
                setCollapsedCompanyIds((current) => {
                  if (current.includes(row.id)) {
                    return current.filter((companyId) => companyId !== row.id)
                  }

                  return [...current, row.id]
                })
              }}
              className="w-full text-left"
              aria-label={`${labels.displayName}: ${row.displayName}`}
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-5 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {row.displayName}
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {monthlyAverageSalary}
                </p>
                <ChevronDownIcon
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </div>
            </button>

            {isExpanded ? (
              <div className="mt-2 space-y-2 border-t border-border/70 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {labels.roleDisplayName}
                    </p>
                    <p className="text-xs text-foreground">{row.roleDisplayName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {labels.annualSalary}
                    </p>
                    <p className="text-xs font-semibold tabular-nums text-foreground">{annualSalary}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {labels.startDate}
                    </p>
                    <p className="text-xs text-foreground">{formatDateValue(row.startDate, locale)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {labels.endDate}
                    </p>
                    <p className="text-xs text-foreground">{formatDateValue(row.endDate, locale)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {eventsTitle}
                  </p>
                  {companyEvents.length === 0 ? (
                    <p className="rounded-md border border-border/70 bg-background/70 px-2 py-1.5 text-xs text-muted-foreground">
                      {noEventsLabel}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {companyEvents.map((event) => (
                        <li
                          key={event.id}
                          className="rounded-md border border-border/70 bg-background/75 px-2 py-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-foreground">
                              {eventTypeLabels[event.eventType] ?? notAvailableLabel}
                            </p>
                            <p className="text-xs font-semibold tabular-nums text-foreground">
                              {formatAmount(locale, row.currency, event.amount, 2)}
                            </p>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-muted-foreground">
                              {formatDateValue(event.effectiveDate, locale)}
                            </p>
                            {event.notes?.trim().length ? (
                              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                {event.notes}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
