import type { CSSProperties } from "react"

import type { ProfileCareerEvent } from "@/app/lib/models/profile/profile-overview.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import {
  normalizeAmountToHourly,
  normalizeAmountToMonthly,
} from "@/app/lib/models/personal-path/personal-path-chart.model"

interface CareerEventsTableProps {
  events: ProfileCareerEvent[]
  currency: string
  compensationType: PathCompaniesEntity["compensationType"]
  monthlyWorkHours: number
  workDaysPerYear: number
  accentColor?: string
  locale: string
  eventTypeLabels: Record<string, string>
  notAvailableLabel: string
  emptyMessage: string
  labels: {
    effectiveDate: string
    eventType: string
    hourlyRate: string
    monthlyAverage: string
    annualSalary: string
  }
}

const DEFAULT_MONTHLY_WORK_HOURS = 174
const DEFAULT_WORK_DAYS_PER_YEAR = 261

function resolveMonthlyWorkHours(value: number): number {
  return value > 0 ? value : DEFAULT_MONTHLY_WORK_HOURS
}

function resolveWorkDaysPerYear(value: number): number {
  return value > 0 ? value : DEFAULT_WORK_DAYS_PER_YEAR
}

function calculateCompensationValues(
  amount: number,
  compensationType: PathCompaniesEntity["compensationType"],
  monthlyWorkHours: number,
  workDaysPerYear: number
) {
  const normalizedMonthlyWorkHours = resolveMonthlyWorkHours(monthlyWorkHours)
  const normalizedWorkDaysPerYear = resolveWorkDaysPerYear(workDaysPerYear)

  const hourlyRate = normalizeAmountToHourly(
    amount,
    compensationType,
    normalizedMonthlyWorkHours
  )
  const monthlyAverage = normalizeAmountToMonthly(
    amount,
    compensationType,
    normalizedMonthlyWorkHours
  )
  const workHoursPerDay = (normalizedMonthlyWorkHours * 12) / normalizedWorkDaysPerYear
  const annualSalary =
    workHoursPerDay > 0
      ? hourlyRate * workHoursPerDay * normalizedWorkDaysPerYear
      : monthlyAverage * 12

  return {
    hourlyRate,
    monthlyAverage,
    annualSalary,
  }
}

function formatAmount(
  locale: string,
  currency: string,
  amount: number,
  maximumFractionDigits = 2
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

function MobileValueItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
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

function getTintPanelStyle(hexColor: string, alpha = 0.11): CSSProperties | undefined {
  const rgb = hexToRgb(hexColor)

  if (!rgb) {
    return undefined
  }

  return {
    backgroundColor: `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${alpha})`,
  }
}

export function CareerEventsTable({
  events,
  currency,
  compensationType,
  monthlyWorkHours,
  workDaysPerYear,
  accentColor,
  locale,
  eventTypeLabels,
  notAvailableLabel,
  emptyMessage,
  labels,
}: CareerEventsTableProps) {
  if (events.length === 0) {
    return <p className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const eventRows = events.map((event) => ({
    event,
    compensation: calculateCompensationValues(
      event.amount,
      compensationType,
      monthlyWorkHours,
      workDaysPerYear
    ),
  }))

  return (
    <>
      <div className="space-y-1 p-1">
        {eventRows.map(({ event, compensation }) => (
          <article
            key={event.id}
            className="rounded-lg px-2.5 py-2"
            style={accentColor ? getTintPanelStyle(accentColor) : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {formatDateValue(event.effectiveDate, locale)}
              </p>
              <p className="truncate text-xs font-medium text-foreground">
                {eventTypeLabels[event.eventType] ?? notAvailableLabel}
              </p>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
              <MobileValueItem
                label={labels.hourlyRate}
                value={formatAmount(locale, currency, compensation.hourlyRate, 2)}
              />
              <MobileValueItem
                label={labels.monthlyAverage}
                value={formatAmount(locale, currency, compensation.monthlyAverage, 2)}
              />
              <MobileValueItem
                label={labels.annualSalary}
                value={formatAmount(locale, currency, compensation.annualSalary, 0)}
                className="col-span-2"
              />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
