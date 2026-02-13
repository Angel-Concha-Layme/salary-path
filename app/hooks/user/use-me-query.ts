"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import { meService } from "@/app/lib/services/user/me.service"
import { queryKeys } from "@/app/lib/services/query-keys"

export function getMeQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.me.detail(),
    queryFn: ({ signal }) => meService.getMe({ signal }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMeQuery() {
  return useQuery(getMeQueryOptions())
}
