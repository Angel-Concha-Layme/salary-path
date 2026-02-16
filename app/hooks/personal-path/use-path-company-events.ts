"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  PathCompanyEventsCreateInput,
  PathCompanyEventsUpdateInput,
} from "@/app/lib/models/personal-path/path-company-events.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { pathCompanyEventsService } from "@/app/lib/services/personal-path/path-company-events.service"

export interface UsePathCompanyEventsListParams {
  limit?: number
}

export interface UsePathCompanyEventsByOwnerListParams {
  limit?: number
}

const PERSONAL_DATA_STALE_TIME_MS = 1000 * 60 * 10
const PERSONAL_DATA_CACHE_TIME_MS = 1000 * 60 * 20

export function getPathCompanyEventsByOwnerListQueryOptions(
  params: UsePathCompanyEventsByOwnerListParams = {}
) {
  const limit = params.limit ?? 500

  return queryOptions({
    queryKey: queryKeys.personalPath.companyEvents.list({ limit }),
    queryFn: ({ signal }) =>
      pathCompanyEventsService.listPathCompanyEventsByOwner({ limit, signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
  })
}

export function getPathCompanyEventsListQueryOptions(
  pathCompanyId: string,
  params: UsePathCompanyEventsListParams = {}
) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.personalPath.companies.events.list(pathCompanyId, { limit }),
    queryFn: ({ signal }) =>
      pathCompanyEventsService.listPathCompanyEvents(pathCompanyId, { limit, signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
    enabled: Boolean(pathCompanyId),
  })
}

export function getPathCompanyEventDetailQueryOptions(pathCompanyId: string, eventId: string) {
  return queryOptions({
    queryKey: queryKeys.personalPath.companies.events.detail(pathCompanyId, eventId),
    queryFn: ({ signal }) =>
      pathCompanyEventsService.getPathCompanyEvent(pathCompanyId, eventId, { signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
    enabled: Boolean(pathCompanyId && eventId),
  })
}

export function usePathCompanyEventsListQuery(
  pathCompanyId: string,
  params: UsePathCompanyEventsListParams = {}
) {
  return useQuery(getPathCompanyEventsListQueryOptions(pathCompanyId, params))
}

export function usePathCompanyEventsByOwnerListQuery(
  params: UsePathCompanyEventsByOwnerListParams = {}
) {
  return useQuery(getPathCompanyEventsByOwnerListQueryOptions(params))
}

export function usePathCompanyEventDetailQuery(pathCompanyId: string, eventId: string) {
  return useQuery(getPathCompanyEventDetailQueryOptions(pathCompanyId, eventId))
}

export function useCreatePathCompanyEventMutation() {
  return useDomainMutation({
    domain: "personalPath",
    invalidate: async (queryClient, _data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companyEvents.root(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companies.events.root(variables.pathCompanyId),
        }),
      ])
    },
    mutationFn: ({
      pathCompanyId,
      input,
    }: {
      pathCompanyId: string
      input: PathCompanyEventsCreateInput
    }) => pathCompanyEventsService.createPathCompanyEvent(pathCompanyId, input),
  })
}

export function useUpdatePathCompanyEventMutation() {
  return useDomainMutation({
    domain: "personalPath",
    invalidate: async (queryClient, _data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companyEvents.root(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companies.events.root(variables.pathCompanyId),
        }),
      ])
    },
    mutationFn: ({
      pathCompanyId,
      eventId,
      input,
    }: {
      pathCompanyId: string
      eventId: string
      input: PathCompanyEventsUpdateInput
    }) => pathCompanyEventsService.updatePathCompanyEvent(pathCompanyId, eventId, input),
  })
}

export function useDeletePathCompanyEventMutation() {
  return useDomainMutation({
    domain: "personalPath",
    invalidate: async (queryClient, _data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companyEvents.root(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalPath.companies.events.root(variables.pathCompanyId),
        }),
      ])
    },
    mutationFn: ({ pathCompanyId, eventId }: { pathCompanyId: string; eventId: string }) =>
      pathCompanyEventsService.deletePathCompanyEvent(pathCompanyId, eventId),
  })
}
