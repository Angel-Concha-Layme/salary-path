"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  PathCompanyEventsCreateInput,
  PathCompanyEventsUpdateInput,
} from "@/app/lib/models/personal-path/path-company-events.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { pathCompanyEventsService } from "@/app/lib/services/personal-path/path-company-events.service"

const PERSONAL_DATA_STALE_TIME_MS = 1000 * 60 * 10
const PERSONAL_DATA_CACHE_TIME_MS = 1000 * 60 * 20

export function getPathCompanyEventsByOwnerListQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.personalPath.companyEvents.list(),
    queryFn: ({ signal }) => pathCompanyEventsService.listPathCompanyEventsByOwner({ signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
  })
}

export function getPathCompanyEventsListQueryOptions(pathCompanyId: string) {
  return queryOptions({
    queryKey: queryKeys.personalPath.companies.events.list(pathCompanyId),
    queryFn: ({ signal }) => pathCompanyEventsService.listPathCompanyEvents(pathCompanyId, { signal }),
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

export function usePathCompanyEventsListQuery(pathCompanyId: string) {
  return useQuery(getPathCompanyEventsListQueryOptions(pathCompanyId))
}

export function usePathCompanyEventsByOwnerListQuery() {
  return useQuery(getPathCompanyEventsByOwnerListQueryOptions())
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
          queryKey: queryKeys.profile.root(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.finance.root(),
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
          queryKey: queryKeys.profile.root(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.finance.root(),
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
          queryKey: queryKeys.profile.root(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.finance.root(),
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
