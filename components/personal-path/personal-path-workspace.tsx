"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangleIcon, ChevronDownIcon } from "lucide-react"

import { usePersonalPathDashboard } from "@/app/hooks/personal-path/use-personal-path-dashboard"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import {
  PERSONAL_PATH_NO_COMPANIES_SELECTION,
  type PersonalPathChartFilters,
  type PersonalPathChartPointMeta,
  type PersonalPathRateBasis,
  type PersonalPathChartView,
  type PersonalPathRangePreset,
} from "@/app/lib/models/personal-path/personal-path-chart.model"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
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
import { CompaniesDrawer } from "@/components/personal-path/companies-drawer"
import { RouteScreen } from "@/components/layout/route-screen"
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
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)

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

  function clearCompanySelection() {
    setCompanyIds([PERSONAL_PATH_NO_COMPANIES_SELECTION])
  }

  const selectedCompaniesLabel = dashboard.availableCompanyIds.length === 0
    ? dictionary.personalPath.chart.noCompanies
    : allCompaniesSelected
      ? dictionary.personalPath.chart.allCompaniesSelected
      : formatCount(dictionary.personalPath.chart.selectedCompaniesCount, selectedCompanyIds.length)

  const eventTypeLabels = dictionary.companies.eventTypes
  const tableRowsById = useMemo(
    () => new Map(dashboard.tableRows.map((row) => [row.id, row])),
    [dashboard.tableRows]
  )
  const eventsByCompanyId = useMemo(() => {
    const map = new Map<string, PathCompanyEventsEntity[]>()

    dashboard.events.forEach((event) => {
      const current = map.get(event.pathCompanyId) ?? []
      current.push(event)
      map.set(event.pathCompanyId, current)
    })

    return map
  }, [dashboard.events])
  const activeCompanyRow = activeCompanyId ? tableRowsById.get(activeCompanyId) ?? null : null
  const activeCompanyEvents = activeCompanyId ? eventsByCompanyId.get(activeCompanyId) ?? [] : []

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
      <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">{dictionary.personalPath.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{dictionary.common.loading}</p>
        </CardContent>
      </Card>
    )
  }

  if (dashboard.isError) {
    return (
      <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">{dictionary.personalPath.title}</CardTitle>
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
      <Card className="rounded-xl border border-border/80 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">{dictionary.personalPath.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{dictionary.personalPath.empty.description}</p>
          <Button asChild>
            <Link href="/career-path/companies">{dictionary.personalPath.empty.cta}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <RouteScreen
      title={dictionary.personalPath.title}
      subtitle={dictionary.personalPath.subtitle}
    >
      <section className="min-w-0 w-full max-w-full space-y-4 text-card-foreground">
        <div className="flex flex-col gap-2 rounded-2xl bg-muted/30 p-2 ring-1 ring-border/60 lg:flex-row">
          <div className="min-w-0 rounded-xl bg-background/85 px-3 py-2 supports-[backdrop-filter]:backdrop-blur-sm lg:flex-1 lg:basis-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.viewLabel}
            </p>
            <Select
              value={view}
              onValueChange={(nextValue) =>
                setView(nextValue as PersonalPathChartView)
              }
            >
              <SelectTrigger className="mt-1 h-9 w-full border-border/60 bg-transparent shadow-none">
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

          <div className="min-w-0 rounded-xl bg-background/85 px-3 py-2 supports-[backdrop-filter]:backdrop-blur-sm lg:flex-1 lg:basis-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.rangeLabel}
            </p>
            <Select
              value={range}
              onValueChange={(nextValue) =>
                setRange(nextValue as PersonalPathRangePreset)
              }
            >
              <SelectTrigger className="mt-1 h-9 w-full border-border/60 bg-transparent shadow-none">
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

          <div className="min-w-0 rounded-xl bg-background/85 px-3 py-2 supports-[backdrop-filter]:backdrop-blur-sm lg:flex-1 lg:basis-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.rateBasisLabel}
            </p>
            <Select
              value={rateBasis}
              onValueChange={(nextValue) =>
                setRateBasis(nextValue as PersonalPathRateBasis)
              }
            >
              <SelectTrigger className="mt-1 h-9 w-full border-border/60 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{dictionary.personalPath.chart.rateBasis.monthly}</SelectItem>
                <SelectItem value="hourly">{dictionary.personalPath.chart.rateBasis.hourly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 rounded-xl bg-background/85 px-3 py-2 supports-[backdrop-filter]:backdrop-blur-sm lg:flex-1 lg:basis-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {dictionary.personalPath.chart.companiesLabel}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="mt-1 h-9 w-full justify-between border-border/60 bg-transparent shadow-none hover:bg-accent/40"
                >
                  <span className="truncate">{selectedCompaniesLabel}</span>
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 border-border/80">
                <DropdownMenuLabel>{dictionary.personalPath.chart.companiesLabel}</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    if (allCompaniesSelected) {
                      clearCompanySelection()
                      return
                    }

                    selectAllCompanies()
                  }}
                >
                  {allCompaniesSelected
                    ? dictionary.personalPath.chart.clearCompanySelection
                    : dictionary.personalPath.chart.selectAllCompanies}
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
                      <span className="size-2 rounded-full" style={{ backgroundColor: company.color }} />
                      <span>{company.displayName}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {dashboard.currencyMismatch ? (
          <div className="flex flex-wrap items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-50/70 px-3 py-2 text-xs text-amber-950 dark:border-amber-300/35 dark:bg-amber-950/20 dark:text-amber-100">
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
            className: "mb-3 rounded-xl bg-muted/30 px-3 py-2 ring-1 ring-border/60",
          }}
          className="rounded-2xl border-0 bg-transparent p-0 shadow-none"
          chartClassName="rounded-2xl bg-background/70"
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
            className: "border-border/60 bg-background/95 shadow-lg supports-[backdrop-filter]:backdrop-blur-sm",
          }}
        />
      </section>

      <section className="w-full max-w-full rounded-xl border border-border/80 bg-background text-card-foreground">
        <header className="border-b border-border/70 bg-background px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
            {dictionary.personalPath.table.title}
          </h2>
        </header>
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-background text-xs uppercase tracking-[0.08em] text-foreground">
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
                  {dictionary.personalPath.table.columns.monthlyAverageSalary}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {dictionary.personalPath.table.columns.annualSalary}
                </th>
              </tr>
            </thead>
            <tbody>
              {dashboard.tableRows.map((row) => {
                const isSelected = row.id === activeCompanyId

                return (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveCompanyId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setActiveCompanyId(row.id)
                      }
                    }}
                    className={cn(
                      "cursor-pointer border-t border-border/70 align-top text-sm text-foreground transition-colors hover:bg-accent/40",
                      isSelected && "bg-background"
                    )}
                    aria-label={`${dictionary.personalPath.table.columns.displayName}: ${row.displayName}`}
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
                      {row.monthlyAverageSalary !== null
                        ? formatAmount(locale, row.currency, row.monthlyAverageSalary, 2)
                        : dictionary.personalPath.table.notAvailable}
                    </td>
                    <td className={cn("whitespace-nowrap px-3 py-2", isSelected && "text-foreground")}>
                      {row.annualSalary !== null
                        ? formatAmount(locale, row.currency, row.annualSalary, 0)
                        : dictionary.personalPath.table.notAvailable}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <CompaniesDrawer
        open={Boolean(activeCompanyRow)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCompanyId(null)
          }
        }}
        company={activeCompanyRow}
        events={activeCompanyEvents}
      />
    </RouteScreen>
  )
}
