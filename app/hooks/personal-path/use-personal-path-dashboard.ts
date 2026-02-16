"use client"

import { useMemo } from "react"

import { usePathCompaniesListQuery } from "@/app/hooks/personal-path/use-path-companies"
import { usePathCompanyEventsByOwnerListQuery } from "@/app/hooks/personal-path/use-path-company-events"
import { useUserFinanceSettingsListQuery } from "@/app/hooks/settings/use-user-finance-settings"
import {
  buildCumulativeIncomeSeries,
  buildPersonalPathCompanyTableRows,
  buildRateChartSeries,
  resolveBaseCurrency,
  type PersonalPathChartFilters,
  type PersonalPathChartSeries,
  type PersonalPathCompanyTableRow,
  type CurrencyMismatchInfo,
} from "@/app/lib/models/personal-path/personal-path-chart.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import { ApiClientError } from "@/app/types/api"

interface UsePersonalPathDashboardOptions {
  filters: PersonalPathChartFilters
}

interface PersonalPathDashboardResult {
  companies: PathCompaniesEntity[]
  events: PathCompanyEventsEntity[]
  tableRows: PersonalPathCompanyTableRow[]
  selectedCompanyIds: string[]
  availableCompanyIds: string[]
  series: PersonalPathChartSeries[]
  currencyMismatch: CurrencyMismatchInfo | null
  baseCurrency: string
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
}

function readErrorMessage(error: unknown): string | null {
  if (error instanceof ApiClientError) {
    return error.message
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return null
}

export function usePersonalPathDashboard({
  filters,
}: UsePersonalPathDashboardOptions): PersonalPathDashboardResult {
  const companiesQuery = usePathCompaniesListQuery({ limit: 200 })
  const eventsQuery = usePathCompanyEventsByOwnerListQuery({ limit: 100 })
  const financeSettingsQuery = useUserFinanceSettingsListQuery({ limit: 1 })

  const companies = useMemo(() => companiesQuery.data?.items ?? [], [companiesQuery.data?.items])
  const events = useMemo(() => eventsQuery.data?.items ?? [], [eventsQuery.data?.items])
  const financeSettings = financeSettingsQuery.data?.items?.[0] ?? null

  const availableCompanyIds = useMemo(
    () => companies.map((company) => company.id),
    [companies]
  )

  const selectedCompanyIds = useMemo(() => {
    if (availableCompanyIds.length === 0) {
      return []
    }

    if (filters.companyIds.length === 0) {
      return availableCompanyIds
    }

    const availableIdSet = new Set(availableCompanyIds)
    const constrained = filters.companyIds.filter((id) => availableIdSet.has(id))

    return constrained.length > 0 ? constrained : availableCompanyIds
  }, [availableCompanyIds, filters.companyIds])

  const baseCurrency = useMemo(
    () => resolveBaseCurrency(companies, financeSettings?.currency),
    [companies, financeSettings?.currency]
  )

  const rateSeries = useMemo(
    () =>
      buildRateChartSeries({
        companies,
        events,
        companyIds: selectedCompanyIds,
        range: filters.range,
        rateBasis: filters.rateBasis,
        monthlyWorkHours: financeSettings?.monthlyWorkHours,
      }),
    [companies, events, filters.range, filters.rateBasis, financeSettings?.monthlyWorkHours, selectedCompanyIds]
  )

  const cumulativeResult = useMemo(
    () =>
      buildCumulativeIncomeSeries({
        companies,
        events,
        companyIds: selectedCompanyIds,
        baseCurrency,
        monthlyWorkHours: financeSettings?.monthlyWorkHours,
        range: filters.range,
      }),
    [
      baseCurrency,
      companies,
      events,
      filters.range,
      financeSettings?.monthlyWorkHours,
      selectedCompanyIds,
    ]
  )

  const series = filters.view === "rate" ? rateSeries : cumulativeResult.series
  const currencyMismatch = filters.view === "cumulativeIncome"
    ? cumulativeResult.currencyMismatch
    : null

  const tableRows = useMemo(
    () => buildPersonalPathCompanyTableRows(companies, events),
    [companies, events]
  )

  const isLoading =
    companiesQuery.isLoading || eventsQuery.isLoading || financeSettingsQuery.isLoading
  const isError = companiesQuery.isError || eventsQuery.isError || financeSettingsQuery.isError
  const errorMessage = readErrorMessage(
    companiesQuery.error ?? eventsQuery.error ?? financeSettingsQuery.error
  )

  return {
    companies,
    events,
    tableRows,
    selectedCompanyIds,
    availableCompanyIds,
    series,
    currencyMismatch,
    baseCurrency,
    isLoading,
    isError,
    errorMessage,
  }
}
