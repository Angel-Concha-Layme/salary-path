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

export function CareerEventsTable({
  events,
  currency,
  compensationType,
  monthlyWorkHours,
  workDaysPerYear,
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[940px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[24%]" />
            <col className="w-[19%]" />
            <col className="w-[19%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-background text-xs uppercase tracking-[0.08em] text-foreground">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.effectiveDate}</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.eventType}</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.hourlyRate}</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.monthlyAverage}</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">{labels.annualSalary}</th>
            </tr>
          </thead>
          <tbody>
            {eventRows.map(({ event, compensation }) => (
              <tr
                key={event.id}
                className="border-t border-border/70 align-top transition-colors hover:bg-accent/40"
              >
                <td className="whitespace-nowrap px-3 py-2">
                  {formatDateValue(event.effectiveDate, locale)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {eventTypeLabels[event.eventType] ?? notAvailableLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatAmount(locale, currency, compensation.hourlyRate, 2)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatAmount(locale, currency, compensation.monthlyAverage, 2)}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatAmount(locale, currency, compensation.annualSalary, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 p-1 md:hidden">
        {eventRows.map(({ event, compensation }) => (
          <article key={event.id} className="rounded-lg bg-accent/15 px-2.5 py-2">
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
