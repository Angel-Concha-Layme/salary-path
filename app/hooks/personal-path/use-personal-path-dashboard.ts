"use client"

import { useMemo } from "react"

import { usePathCompaniesListQuery } from "@/app/hooks/personal-path/use-path-companies"
import { usePathCompanyEventsByOwnerListQuery } from "@/app/hooks/personal-path/use-path-company-events"
import { useUserFinanceSettingsListQuery } from "@/app/hooks/settings/use-user-finance-settings"
import {
  buildPersonalPathCompanyTableRows,
  buildRateChartSeries,
  PERSONAL_PATH_NO_COMPANIES_SELECTION,
  type PersonalPathChartFilters,
  type PersonalPathChartSeries,
  type PersonalPathCompanyTableRow,
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
  const companiesQuery = usePathCompaniesListQuery()
  const eventsQuery = usePathCompanyEventsByOwnerListQuery()
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

    if (filters.companyIds.includes(PERSONAL_PATH_NO_COMPANIES_SELECTION)) {
      return []
    }

    const availableIdSet = new Set(availableCompanyIds)
    const constrained = filters.companyIds.filter((id) => availableIdSet.has(id))

    return constrained.length > 0 ? constrained : availableCompanyIds
  }, [availableCompanyIds, filters.companyIds])

  const series = useMemo(
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

  const tableRows = useMemo(
    () => buildPersonalPathCompanyTableRows(companies, events, financeSettings?.monthlyWorkHours),
    [companies, events, financeSettings?.monthlyWorkHours]
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
    isLoading,
    isError,
    errorMessage,
  }
}
