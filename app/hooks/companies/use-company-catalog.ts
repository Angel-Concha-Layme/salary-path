"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  CompanyCatalogCreateInput,
  CompanyCatalogUpdateInput,
} from "@/app/lib/models/companies/company-catalog.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { companyCatalogService } from "@/app/lib/services/companies/company-catalog.service"

export interface UseCompanyCatalogListParams {
  limit?: number
  search?: string
  enabled?: boolean
}

const PERSONAL_DATA_STALE_TIME_MS = 1000 * 60 * 10
const PERSONAL_DATA_CACHE_TIME_MS = 1000 * 60 * 20

export function getCompanyCatalogListQueryOptions(params: UseCompanyCatalogListParams = {}) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.companies.companyCatalog.list({
      limit,
      search: params.search,
    }),
    queryFn: ({ signal }) =>
      companyCatalogService.listCompanyCatalog({
        limit,
        search: params.search,
        signal,
      }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
    enabled: params.enabled ?? true,
  })
}

export function getCompanyCatalogDetailQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: queryKeys.companies.companyCatalog.detail(companyId),
    queryFn: ({ signal }) => companyCatalogService.getCompanyCatalog(companyId, { signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
    enabled: Boolean(companyId),
  })
}

export function useCompanyCatalogListQuery(params: UseCompanyCatalogListParams = {}) {
  return useQuery(getCompanyCatalogListQueryOptions(params))
}

export function useCompanyCatalogDetailQuery(companyId: string) {
  return useQuery(getCompanyCatalogDetailQueryOptions(companyId))
}

export function useCreateCompanyCatalogMutation() {
  return useDomainMutation({
    domain: "companies",
    mutationFn: (input: CompanyCatalogCreateInput) => companyCatalogService.createCompanyCatalog(input),
  })
}

export function useUpdateCompanyCatalogMutation() {
  return useDomainMutation({
    domain: "companies",
    mutationFn: ({
      companyId,
      input,
    }: {
      companyId: string
      input: CompanyCatalogUpdateInput
    }) => companyCatalogService.updateCompanyCatalog(companyId, input),
  })
}

export function useDeleteCompanyCatalogMutation() {
  return useDomainMutation({
    domain: "companies",
    mutationFn: (companyId: string) => companyCatalogService.deleteCompanyCatalog(companyId),
  })
}
