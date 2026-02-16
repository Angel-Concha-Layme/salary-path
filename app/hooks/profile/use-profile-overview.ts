"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import { profileOverviewService } from "@/app/lib/services/profile/profile-overview.service"
import { queryKeys } from "@/app/lib/services/query-keys"

const PERSONAL_DATA_STALE_TIME_MS = 1000 * 60 * 10
const PERSONAL_DATA_CACHE_TIME_MS = 1000 * 60 * 20

export function getProfileOverviewQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.profile.overview(),
    queryFn: ({ signal }) => profileOverviewService.getProfileOverview({ signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
  })
}

export function useProfileOverviewQuery() {
  return useQuery(getProfileOverviewQueryOptions())
}
