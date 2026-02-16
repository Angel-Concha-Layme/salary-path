"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  PathCompaniesCreateInput,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { pathCompaniesService } from "@/app/lib/services/personal-path/path-companies.service"

export interface UsePathCompaniesListParams {
  limit?: number
}

const PERSONAL_DATA_STALE_TIME_MS = 1000 * 60 * 10
const PERSONAL_DATA_CACHE_TIME_MS = 1000 * 60 * 20

export function getPathCompaniesListQueryOptions(params: UsePathCompaniesListParams = {}) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.personalPath.companies.list({ limit }),
    queryFn: ({ signal }) => pathCompaniesService.listPathCompanies({ limit, signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
  })
}

export function getPathCompanyDetailQueryOptions(pathCompanyId: string) {
  return queryOptions({
    queryKey: queryKeys.personalPath.companies.detail(pathCompanyId),
    queryFn: ({ signal }) => pathCompaniesService.getPathCompany(pathCompanyId, { signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
    enabled: Boolean(pathCompanyId),
  })
}

export function usePathCompaniesListQuery(params: UsePathCompaniesListParams = {}) {
  return useQuery(getPathCompaniesListQueryOptions(params))
}

export function usePathCompanyDetailQuery(pathCompanyId: string) {
  return useQuery(getPathCompanyDetailQueryOptions(pathCompanyId))
}

export function useCreatePathCompanyMutation() {
  return useDomainMutation({
    domain: "personalPath",
    invalidate: async (queryClient) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.personalPath.companies.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companies.companyCatalog.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles.roleCatalog.root() }),
      ])
    },
    mutationFn: (input: PathCompaniesCreateInput) => pathCompaniesService.createPathCompany(input),
  })
}

export function useUpdatePathCompanyMutation() {
  return useDomainMutation({
    domain: "personalPath",
    invalidate: async (queryClient, _data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.personalPath.companies.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.root() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companies.detail(variables.pathCompanyId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companies.events.root(variables.pathCompanyId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.companies.companyCatalog.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles.roleCatalog.root() }),
      ])
    },
    mutationFn: ({
      pathCompanyId,
      input,
    }: {
      pathCompanyId: string
      input: PathCompaniesUpdateInput
    }) => pathCompaniesService.updatePathCompany(pathCompanyId, input),
  })
}

export function useDeletePathCompanyMutation() {
  return useDomainMutation({
    domain: "personalPath",
    invalidate: async (queryClient, _data, pathCompanyId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.personalPath.companies.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.personalPath.companyEvents.root() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companies.events.root(pathCompanyId),
        }),
      ])
    },
    mutationFn: (pathCompanyId: string) => pathCompaniesService.deletePathCompany(pathCompanyId),
  })
}
