"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangleIcon, ChevronDownIcon } from "lucide-react"

import { usePersonalPathDashboard } from "@/app/hooks/personal-path/use-personal-path-dashboard"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type {
  PersonalPathChartFilters,
  PersonalPathChartPointMeta,
  PersonalPathRateBasis,
  PersonalPathChartView,
  PersonalPathRangePreset,
} from "@/app/lib/models/personal-path/personal-path-chart.model"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  SalaryHistoryChartWrapper,
  type SalaryHistoryTooltipPayload,
} from "@/components/charts/salary-history-chart-wrapper"
import { cn } from "@/lib/utils"

const RANGE_PRESETS: PersonalPathRangePreset[] = ["all", "ytd", "last12m", "last36m"]

function formatDateKey(dateKey: string, locale: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
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

function formatSignedAmount(
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

function formatCount(template: string, value: number): string {
  return template.replace("{count}", String(value))
}

export function PersonalPathWorkspace() {
  const { dictionary, locale } = useDictionary()
  const [view, setView] = useState<PersonalPathChartView>("rate")
  const [range, setRange] = useState<PersonalPathRangePreset>("all")
  const [rateBasis, setRateBasis] = useState<PersonalPathRateBasis>("monthly")
  const [companyIds, setCompanyIds] = useState<string[]>([])

  const filters = useMemo<PersonalPathChartFilters>(
    () => ({
      view,
      range,
      rateBasis,
      companyIds,
    }),
    [companyIds, range, rateBasis, view]
  )
  const dashboard = usePersonalPathDashboard({ filters })

  const sortedCompanies = useMemo(
    () => [...dashboard.companies].sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [dashboard.companies]
  )

  const selectedCompanyIds = dashboard.selectedCompanyIds
  const selectedCompanyIdSet = useMemo(
    () => new Set(selectedCompanyIds),
    [selectedCompanyIds]
  )
  const allCompaniesSelected =
    dashboard.availableCompanyIds.length > 0 &&
    selectedCompanyIds.length === dashboard.availableCompanyIds.length

  function toggleCompany(companyId: string) {
    const allowed = new Set(dashboard.availableCompanyIds)

    setCompanyIds((current) => {
      const active = new Set(
        current.length > 0 ? current.filter((id) => allowed.has(id)) : dashboard.availableCompanyIds
      )

      if (active.has(companyId)) {
        active.delete(companyId)
      } else {
        active.add(companyId)
      }

      const next = Array.from(active)
      return next.length > 0 ? next : dashboard.availableCompanyIds
    })
  }

  function selectAllCompanies() {
    setCompanyIds(dashboard.availableCompanyIds)
  }

  const selectedCompaniesLabel = dashboard.availableCompanyIds.length === 0
    ? dictionary.personalPath.chart.noCompanies
    : allCompaniesSelected
      ? dictionary.personalPath.chart.allCompaniesSelected
      : formatCount(dictionary.personalPath.chart.selectedCompaniesCount, selectedCompanyIds.length)

  const eventTypeLabels = dictionary.companies.eventTypes

  function renderTooltip(payload: SalaryHistoryTooltipPayload<PersonalPathChartPointMeta>) {
    if (view === "rate") {
      return (
        <div className="space-y-1">
          <p className="font-semibold">
            {dictionary.personalPath.chart.dateLabel}: {payload.formattedDate}
          </p>
          {payload.items.map((item) => {
            if (item.meta.type !== "rate") {
              return null
            }

            const amountLabel = formatAmount(
              locale,
              item.meta.currency,
              item.value,
              item.meta.normalizedCompensationType === "hourly" ? 2 : 0
            )
            const increaseLabel = formatSignedAmount(
              locale,
              item.meta.currency,
              item.meta.increase,
              item.meta.normalizedCompensationType === "hourly" ? 2 : 0
            )

            return (
              <div key={`${payload.dateKey}-${item.seriesId}`} className="space-y-0.5">
                <p className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.label}</span>
                </p>
                <p>
                  {dictionary.personalPath.chart.valueLabel}: {amountLabel}
                </p>
                <p>
                  {dictionary.personalPath.chart.eventTypeLabel}: {eventTypeLabels[item.meta.eventType]}
                </p>
                <p>
                  {dictionary.personalPath.chart.changeLabel}: {increaseLabel}
                </p>
              </div>
            )
          })}
        </div>
      )
    }

    const item = payload.items[0]

    if (!item || item.meta.type !== "cumulative") {
      return null
    }

    return (
      <div className="space-y-1">
        <p className="font-semibold">
          {dictionary.personalPath.chart.dateLabel}: {payload.formattedDate}
        </p>
        <p>
          {dictionary.personalPath.chart.valueLabel}:{" "}
          {formatAmount(locale, item.meta.currency, item.value, 0)}
        </p>
        <p>
          {dictionary.personalPath.chart.monthlyTotalLabel}:{" "}
          {formatAmount(locale, item.meta.currency, item.meta.monthlyTotal, 0)}
        </p>
        <p>
          {dictionary.personalPath.chart.activeCompaniesLabel}:{" "}
          {item.meta.activeCompanyNames.length > 0
            ? item.meta.activeCompanyNames.join(", ")
            : dictionary.personalPath.table.notAvailable}
        </p>
      </div>
    )
  }

  if (dashboard.isLoading) {
    return (
      <Card className="rounded-xl border border-border">
        <CardHeader>
          <CardTitle>{dictionary.personalPath.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{dictionary.common.loading}</p>
        </CardContent>
      </Card>
    )
  }

  if (dashboard.isError) {
    return (
      <Card className="rounded-xl border border-border">
        <CardHeader>
          <CardTitle>{dictionary.personalPath.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium text-destructive">{dictionary.personalPath.error.title}</p>
          <p className="text-sm text-muted-foreground">
            {dashboard.errorMessage ?? dictionary.common.unknownError}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (dashboard.companies.length === 0) {
    return (
      <Card className="rounded-xl border border-border">
        <CardHeader>
          <CardTitle>{dictionary.personalPath.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{dictionary.personalPath.empty.description}</p>
          <Button asChild>
            <Link href="/companies">{dictionary.personalPath.empty.cta}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{dictionary.personalPath.title}</h1>
        <p className="text-sm text-muted-foreground">{dictionary.personalPath.subtitle}</p>
      </header>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,180px)_minmax(0,1fr)]">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.viewLabel}
            </p>
            <Select
              value={view}
              onValueChange={(nextValue) =>
                setView(nextValue as PersonalPathChartView)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rate">{dictionary.personalPath.chart.views.rate}</SelectItem>
                <SelectItem value="cumulativeIncome">
                  {dictionary.personalPath.chart.views.cumulativeIncome}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.rangeLabel}
            </p>
            <Select
              value={range}
              onValueChange={(nextValue) =>
                setRange(nextValue as PersonalPathRangePreset)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {dictionary.personalPath.chart.ranges[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.rateBasisLabel}
            </p>
            <Select
              value={rateBasis}
              onValueChange={(nextValue) =>
                setRateBasis(nextValue as PersonalPathRateBasis)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{dictionary.personalPath.chart.rateBasis.monthly}</SelectItem>
                <SelectItem value="hourly">{dictionary.personalPath.chart.rateBasis.hourly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.companiesLabel}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="truncate">{selectedCompaniesLabel}</span>
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>{dictionary.personalPath.chart.companiesLabel}</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    selectAllCompanies()
                  }}
                >
                  {dictionary.personalPath.chart.selectAllCompanies}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {sortedCompanies.map((company) => (
                  <DropdownMenuCheckboxItem
                    key={company.id}
                    checked={selectedCompanyIdSet.has(company.id)}
                    onCheckedChange={() => toggleCompany(company.id)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: company.color }}
                      />
                      <span>{company.displayName}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {dashboard.currencyMismatch ? (
          <div className="flex flex-wrap items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
            <p>
              {formatCount(
                dictionary.personalPath.chart.currencyWarning,
                dashboard.currencyMismatch.excludedCount
              )}{" "}
              {dictionary.personalPath.chart.currencyWarningSuffix} {dashboard.baseCurrency}:{" "}
              {dashboard.currencyMismatch.excludedCompanyNames.join(", ")}
            </p>
          </div>
        ) : null}

        <SalaryHistoryChartWrapper<PersonalPathChartPointMeta>
          view={view}
          filters={{
            range,
            companyIds: selectedCompanyIds,
          }}
          series={dashboard.series}
          height={320}
          legend={{
            title: dictionary.personalPath.chart.legendTitle,
          }}
          emptyState={dictionary.personalPath.chart.emptyState}
          formatters={{
            date: (dateKey) => formatDateKey(dateKey, locale),
            value: (value, item) => {
              if (item.meta.type === "rate") {
                return formatAmount(
                  locale,
                  item.meta.currency,
                  value,
                  item.meta.normalizedCompensationType === "hourly" ? 2 : 0
                )
              }

              return formatAmount(locale, item.meta.currency, value, 0)
            },
          }}
          tooltip={{
            render: renderTooltip,
          }}
        />
      </section>

      <section className="rounded-xl border border-border bg-card text-card-foreground">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {dictionary.personalPath.table.title}
          </h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1900px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.displayName}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.roleDisplayName}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.startDate}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.endDate}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.compensationType}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.currency}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.score}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.review}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.color}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.companyCatalogId}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.roleCatalogId}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.createdAt}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.updatedAt}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.eventCount}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.latestEventType}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.latestEventDate}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.latestEventAmount}
                </th>
              </tr>
            </thead>
            <tbody>
              {dashboard.tableRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border align-top text-sm text-foreground"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{row.displayName}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.roleDisplayName}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDateValue(row.startDate, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDateValue(row.endDate, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.compensationType === "hourly"
                      ? dictionary.companies.options.compensationHourly
                      : dictionary.companies.options.compensationMonthly}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{row.currency}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.score}</td>
                  <td className="max-w-[360px] px-3 py-2 text-muted-foreground">
                    <span className={cn("line-clamp-2", row.review.trim().length === 0 && "italic")}>
                      {row.review.trim().length > 0
                        ? row.review
                        : dictionary.personalPath.table.notAvailable}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full border border-border/80"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.color}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {row.companyCatalogId ?? dictionary.personalPath.table.notAvailable}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {row.roleCatalogId ?? dictionary.personalPath.table.notAvailable}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDateValue(row.createdAt, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDateValue(row.updatedAt, locale)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.eventCount}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.latestEventType
                      ? eventTypeLabels[row.latestEventType]
                      : dictionary.personalPath.table.notAvailable}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDateValue(row.latestEventDate, locale)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.latestEventAmount !== null
                      ? formatAmount(locale, row.currency, row.latestEventAmount, 2)
                      : dictionary.personalPath.table.notAvailable}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
