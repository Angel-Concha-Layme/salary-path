import type {
  MonthlyIncomeCurrencyBucket,
  MonthlyIncomeSourceType,
} from "@/app/lib/models/finance/monthly-income.model"
import type {
  PersonalPathRangePreset,
} from "@/app/lib/models/personal-path/personal-path-chart.model"
import type { SalaryHistoryChartSeries } from "@/components/charts/salary-history-chart-wrapper"

export const RANGE_PRESETS: PersonalPathRangePreset[] = ["all", "ytd", "last12m", "last36m"]
export const MONTHLY_CHART_COLORS = ["#0F766E", "#0284C7", "#7C3AED", "#C2410C", "#B91C1C", "#047857"]

export interface MonthlyIncomeChartMeta {
  type: "monthly-income"
  currency: string
  totals: MonthlyIncomeCurrencyBucket["totals"]
}

export interface SourceFormState {
  bucketKey: string
  mode: "create" | "edit"
  sourceType: MonthlyIncomeSourceType
  sourceId: string | null
  amount: number
  note: string
}

export function formatDateKey(dateKey: string, locale: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return dateKey
  }

  const parsed = new Date(Date.UTC(year, month - 1, day))

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed)
}

export function formatMonthKey(monthKey: string, locale: string): string {
  const [yearRaw, monthRaw] = monthKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)

  if (Number.isNaN(year) || Number.isNaN(month)) {
    return monthKey
  }

  const parsed = new Date(Date.UTC(year, month - 1, 1))

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed)
}

export function formatAmount(
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

export function formatSignedAmount(
  locale: string,
  currency: string,
  amount: number,
  maximumFractionDigits: number
): string {
  if (amount === 0) {
    return formatAmount(locale, currency, 0, maximumFractionDigits)
  }

  const sign = amount > 0 ? "+" : "-"
  return `${sign}${formatAmount(locale, currency, Math.abs(amount), maximumFractionDigits)}`
}

export function formatCount(template: string, value: number): string {
  return template.replace("{count}", String(value))
}

function toMonthStartDateKey(monthKey: string): string {
  return `${monthKey}-01`
}

export function buildMonthlyIncomeChartSeries(
  buckets: MonthlyIncomeCurrencyBucket[]
): SalaryHistoryChartSeries<MonthlyIncomeChartMeta>[] {
  const byCurrency = new Map<string, MonthlyIncomeCurrencyBucket[]>()

  buckets.forEach((bucket) => {
    const current = byCurrency.get(bucket.currency) ?? []
    current.push(bucket)
    byCurrency.set(bucket.currency, current)
  })

  return Array.from(byCurrency.entries())
    .sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency))
    .map(([currency, items], index) => {
      const sortedItems = [...items].sort((left, right) => left.month.localeCompare(right.month))

      return {
        id: `monthly-income-${currency}`,
        label: currency,
        color: MONTHLY_CHART_COLORS[index % MONTHLY_CHART_COLORS.length] ?? "#0F766E",
        lineType: "simple",
        points: sortedItems.map((bucket) => ({
          time: toMonthStartDateKey(bucket.month),
          value: bucket.totals.final,
          meta: {
            type: "monthly-income",
            currency,
            totals: bucket.totals,
          } satisfies MonthlyIncomeChartMeta,
        })),
      } satisfies SalaryHistoryChartSeries<MonthlyIncomeChartMeta>
    })
}

export function isMonthOlderThanOne(monthKey: string): boolean {
  const [yearRaw, monthRaw] = monthKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return false
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const now = new Date()
  const nowMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const previousMonth = new Date(
    Date.UTC(nowMonth.getUTCFullYear(), nowMonth.getUTCMonth() - 1, 1)
  )

  return monthStart.getTime() < previousMonth.getTime()
}

export function sourceTypeSortWeight(sourceType: MonthlyIncomeSourceType): number {
  if (sourceType === "employment") return 0
  if (sourceType === "bonus") return 1
  if (sourceType === "extra_income") return 2
  return 3
}
