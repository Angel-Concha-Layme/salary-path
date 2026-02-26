"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { useMonthlyIncomeListQuery } from "@/app/hooks/finance/use-monthly-income"
import { useBreakpointData } from "@/app/hooks/use-breakpoint-data"
import { usePersonalPathDashboard } from "@/app/hooks/personal-path/use-personal-path-dashboard"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import {
  PERSONAL_PATH_NO_COMPANIES_SELECTION,
  type PersonalPathChartFilters,
  type PersonalPathRangePreset,
  type PersonalPathRateBasis,
} from "@/app/lib/models/personal-path/personal-path-chart.model"
import { RouteScreen } from "@/components/layout/route-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { CompensationChartPanel } from "./compensation-chart-panel"
import { MonthlyIncomeChartPanel } from "./monthly-income-chart-panel"
import { MonthlyIncomeTablePanel } from "./monthly-income-table-panel"
import { PersonalPathCompaniesTableMobileLayout } from "./personal-path-companies-table-layouts"
import {
  buildMonthlyIncomeChartSeries,
  formatCount,
} from "./personal-path-formatters"

export function PersonalPathScreen() {
  const { dictionary, locale } = useDictionary()
  const breakpoint = useBreakpointData()

  const [range, setRange] = useState<PersonalPathRangePreset>("all")
  const [rateBasis, setRateBasis] = useState<PersonalPathRateBasis>("monthly")
  const [companyIds, setCompanyIds] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getUTCFullYear().toString()
  )

  const filters = useMemo<PersonalPathChartFilters>(
    () => ({ range, rateBasis, companyIds }),
    [companyIds, range, rateBasis]
  )

  const dashboard = usePersonalPathDashboard({ filters })
  const monthlyIncomeQuery = useMonthlyIncomeListQuery({ range })

  const sortedCompanies = useMemo(
    () =>
      [...dashboard.companies].sort((left, right) =>
        left.displayName.localeCompare(right.displayName)
      ),
    [dashboard.companies]
  )

  const selectedCompanyIds = dashboard.selectedCompanyIds
  const selectedCompanyIdSet = useMemo(() => new Set(selectedCompanyIds), [selectedCompanyIds])
  const allCompaniesSelected =
    dashboard.availableCompanyIds.length > 0 &&
    selectedCompanyIds.length === dashboard.availableCompanyIds.length

  const eventsByCompanyId = useMemo(() => {
    const map = new Map<string, PathCompanyEventsEntity[]>()
    dashboard.events.forEach((event) => {
      const current = map.get(event.pathCompanyId) ?? []
      current.push(event)
      map.set(event.pathCompanyId, current)
    })
    return map
  }, [dashboard.events])

  const monthlyItems = useMemo(
    () =>
      [...(monthlyIncomeQuery.data?.items ?? [])].sort((left, right) => {
        if (left.month === right.month) {
          return left.currency.localeCompare(right.currency)
        }
        return left.month < right.month ? 1 : -1
      }),
    [monthlyIncomeQuery.data?.items]
  )

  const monthlyChartSeries = useMemo(
    () => buildMonthlyIncomeChartSeries(monthlyItems),
    [monthlyItems]
  )

  const availableYears = useMemo(() => {
    const years = new Set(monthlyItems.map((bucket) => bucket.month.slice(0, 4)))
    return Array.from(years).sort().reverse()
  }, [monthlyItems])

  const filteredMonthlyItems = useMemo(() => {
    if (selectedYear === "all") return monthlyItems
    return monthlyItems.filter((bucket) => bucket.month.startsWith(selectedYear))
  }, [monthlyItems, selectedYear])

  const selectedCompaniesLabel =
    dashboard.availableCompanyIds.length === 0
      ? dictionary.personalPath.chart.noCompanies
      : allCompaniesSelected
        ? dictionary.personalPath.chart.allCompaniesSelected
        : formatCount(
          dictionary.personalPath.chart.selectedCompaniesCount,
          selectedCompanyIds.length
        )

  function toggleCompany(companyId: string) {
    const allowed = new Set(dashboard.availableCompanyIds)
    setCompanyIds((current) => {
      const active = new Set(
        current.length > 0
          ? current.filter((id) => allowed.has(id))
          : dashboard.availableCompanyIds
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

  const compensationChart = (
    <CompensationChartPanel
      series={dashboard.series}
      range={range}
      onRangeChange={setRange}
      rateBasis={rateBasis}
      onRateBasisChange={setRateBasis}
      selectedCompanyIds={selectedCompanyIds}
      sortedCompanies={sortedCompanies}
      selectedCompaniesLabel={selectedCompaniesLabel}
      allCompaniesSelected={allCompaniesSelected}
      selectedCompanyIdSet={selectedCompanyIdSet}
      onToggleCompany={toggleCompany}
      onSelectAllCompanies={selectAllCompanies}
      onClearCompanySelection={clearCompanySelection}
      showLegend={breakpoint.isDesktop}
      locale={locale}
      labels={dictionary.personalPath.chart}
      eventTypeLabels={dictionary.companies.eventTypes}
    />
  )

  const monthlyIncomeChart = (
    <MonthlyIncomeChartPanel
      series={monthlyChartSeries}
      showLegend={breakpoint.isDesktop}
      locale={locale}
      labels={{
        realMonthlyIncomeTitle: dictionary.personalPath.chart.realMonthlyIncomeTitle,
        subtitle: dictionary.personalPath.monthly.subtitle,
        legendTitle: dictionary.personalPath.monthly.legendTitle,
        emptyState: dictionary.personalPath.monthly.emptyState,
        month: dictionary.personalPath.monthly.labels.month,
        final: dictionary.personalPath.monthly.labels.final,
        employment: dictionary.personalPath.monthly.labels.employment,
        bonus: dictionary.personalPath.monthly.labels.bonus,
        extraIncome: dictionary.personalPath.monthly.labels.extraIncome,
        adjustment: dictionary.personalPath.monthly.labels.adjustment,
      }}
    />
  )

  const monthlyIncomeTableErrorMessage = monthlyIncomeQuery.isError
    ? (monthlyIncomeQuery.error instanceof Error
      ? monthlyIncomeQuery.error.message
      : dictionary.common.unknownError)
    : null

  const monthlyIncomeTable = (
    <MonthlyIncomeTablePanel
      items={filteredMonthlyItems}
      selectedYear={selectedYear}
      onSelectedYearChange={setSelectedYear}
      availableYears={availableYears}
      locale={locale}
      labels={dictionary.personalPath.monthly}
      unknownErrorLabel={dictionary.common.unknownError}
      errorMessage={monthlyIncomeTableErrorMessage}
    />
  )

  const companiesSection = (
    <article className="w-full max-w-full text-card-foreground md:overflow-hidden md:rounded-xl md:border md:border-border/80 md:bg-background">
      <header className="px-1 pb-2 pt-1 md:border-b md:border-border/70 md:bg-background md:px-4 md:py-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-sm md:text-foreground">
          {dictionary.personalPath.chart.companiesLabel}
        </h2>
      </header>
      <PersonalPathCompaniesTableMobileLayout
        rows={dashboard.tableRows}
        locale={locale}
        labels={dictionary.personalPath.table.columns}
        notAvailableLabel={dictionary.personalPath.table.notAvailable}
        eventsByCompanyId={eventsByCompanyId}
        eventTypeLabels={dictionary.companies.eventTypes}
        detailsTitle={dictionary.personalPath.drawer.detailsTitle}
        eventsTitle={dictionary.personalPath.drawer.eventsTitle}
        noEventsLabel={dictionary.personalPath.drawer.noEvents}
      />
    </article>
  )

  if (breakpoint.isMobile) {
    return (
      <RouteScreen
        title={dictionary.personalPath.title}
        subtitle={dictionary.personalPath.subtitle}
      >
        {compensationChart}
        {companiesSection}
        {monthlyIncomeChart}
        {monthlyIncomeTable}
      </RouteScreen>
    )
  }

  return (
    <RouteScreen
      title={dictionary.personalPath.title}
      subtitle={dictionary.personalPath.subtitle}
    >
      <section className="grid gap-4 xl:grid-cols-2">
        {compensationChart}
        {monthlyIncomeChart}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {companiesSection}
        {monthlyIncomeTable}
      </section>
    </RouteScreen>
  )
}
