"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AlertTriangleIcon, ChevronDownIcon } from "lucide-react"

import { useBreakpointData } from "@/app/hooks/use-breakpoint-data"
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
import { CompaniesDrawer } from "@/app/(protected-app)/career-path/salary-tracking/_components/companies-drawer"
import {
  PersonalPathCompaniesTableDesktopLayout,
  PersonalPathCompaniesTableMobileLayout,
} from "@/app/(protected-app)/career-path/salary-tracking/_components/personal-path-companies-table-layouts"
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

export function PersonalPathScreen() {
  const { dictionary, locale } = useDictionary()
  const breakpoint = useBreakpointData()
  const rateViewFilterLabel =
    !breakpoint.isDesktop && locale.startsWith("es")
      ? "Compensación"
      : dictionary.personalPath.chart.views.rate
  const rateBasisFilterLabel =
    !breakpoint.isDesktop && locale.startsWith("es")
      ? "Compansación"
      : dictionary.personalPath.chart.rateBasisLabel
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
            const shouldShowChange = Math.abs(item.meta.increase) > Number.EPSILON

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
                {shouldShowChange ? (
                  <p>
                    {dictionary.personalPath.chart.changeLabel}: {increaseLabel}
                  </p>
                ) : null}
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
      <RouteScreen
        title={dictionary.personalPath.title}
        subtitle={dictionary.personalPath.subtitle}
        isLoading
      >
        {null}
      </RouteScreen>
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
      <section className="min-w-0 w-full max-w-full text-card-foreground">
        <div className="bg-background md:overflow-hidden md:rounded-2xl md:border md:border-border/80">
          <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="order-2 space-y-3 p-4 xl:order-1 xl:p-5">
              {dashboard.currencyMismatch ? (
                <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
                  <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
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
                legend={breakpoint.isDesktop
                  ? {
                    title: dictionary.personalPath.chart.legendTitle,
                    className: cn(
                      "mb-3 space-y-2 pb-2 border-b border-border/70"
                    ),
                    itemClassName: "border-border/70 bg-transparent",
                  }
                  : undefined}
                className="rounded-none border-0 bg-transparent p-0 shadow-none"
                chartClassName="min-w-0 w-full max-w-full"
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
                  className: "border-border/70 bg-background/95 shadow-lg supports-[backdrop-filter]:backdrop-blur-sm",
                }}
              />
            </div>

            <aside className="order-1 p-4 md:border-b md:border-border/70 xl:order-2 xl:border-b-0 xl:border-l xl:p-5">
              <div className="xl:sticky xl:top-24">
                <div
                  className={cn(
                    "grid gap-3",
                    breakpoint.isDesktop ? "grid-cols-1" : "grid-cols-2"
                  )}
                >
                  <div className="min-w-0 space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {dictionary.personalPath.chart.viewLabel}
                  </p>
                  <Select
                    value={view}
                    onValueChange={(nextValue) =>
                      setView(nextValue as PersonalPathChartView)
                    }
                  >
                    <SelectTrigger className="h-8 w-full border-border/70 bg-background shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rate">{rateViewFilterLabel}</SelectItem>
                      <SelectItem value="cumulativeIncome">
                        {dictionary.personalPath.chart.views.cumulativeIncome}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className={cn(
                    "min-w-0 space-y-1.5",
                    breakpoint.isDesktop && "pt-3 md:border-t md:border-border/60"
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {dictionary.personalPath.chart.rangeLabel}
                  </p>
                  <Select
                    value={range}
                    onValueChange={(nextValue) =>
                      setRange(nextValue as PersonalPathRangePreset)
                    }
                  >
                    <SelectTrigger className="h-8 w-full border-border/70 bg-background shadow-none">
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

                <div
                  className={cn(
                    "min-w-0 space-y-1.5",
                    breakpoint.isDesktop && "pt-3 md:border-t md:border-border/60"
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {rateBasisFilterLabel}
                  </p>
                  <Select
                    value={rateBasis}
                    onValueChange={(nextValue) =>
                      setRateBasis(nextValue as PersonalPathRateBasis)
                    }
                  >
                    <SelectTrigger className="h-8 w-full border-border/70 bg-background shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{dictionary.personalPath.chart.rateBasis.monthly}</SelectItem>
                      <SelectItem value="hourly">{dictionary.personalPath.chart.rateBasis.hourly}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className={cn(
                    "min-w-0 space-y-1.5",
                    breakpoint.isDesktop && "pt-3 md:border-t md:border-border/60"
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {dictionary.personalPath.chart.companiesLabel}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 w-full justify-between border-border/70 bg-background font-normal shadow-none hover:bg-accent/40"
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
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section
        className={cn(
          "w-full max-w-full text-card-foreground",
          breakpoint.isDesktop && "rounded-xl border border-border/80 bg-background"
        )}
      >
        <header
          className={cn(
            breakpoint.isDesktop
              ? "border-b border-border/70 bg-background px-4 py-3"
              : "px-1 pb-2 pt-1"
          )}
        >
          <h2 className={cn(
            "text-sm font-semibold uppercase tracking-[0.12em] text-foreground",
            !breakpoint.isDesktop && "text-xs text-muted-foreground"
          )}>
            {dictionary.personalPath.chart.companiesLabel}
          </h2>
        </header>
        {breakpoint.isDesktop ? (
          <PersonalPathCompaniesTableDesktopLayout
            rows={dashboard.tableRows}
            activeCompanyId={activeCompanyId}
            locale={locale}
            labels={dictionary.personalPath.table.columns}
            notAvailableLabel={dictionary.personalPath.table.notAvailable}
            onSelectCompany={setActiveCompanyId}
          />
        ) : (
          <PersonalPathCompaniesTableMobileLayout
            rows={dashboard.tableRows}
            locale={locale}
            labels={dictionary.personalPath.table.columns}
            notAvailableLabel={dictionary.personalPath.table.notAvailable}
            eventsByCompanyId={eventsByCompanyId}
            eventTypeLabels={eventTypeLabels}
            eventsTitle={dictionary.personalPath.drawer.eventsTitle}
            noEventsLabel={dictionary.personalPath.drawer.noEvents}
          />
        )}
      </section>

      {breakpoint.isDesktop ? (
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
      ) : null}
    </RouteScreen>
  )
}
