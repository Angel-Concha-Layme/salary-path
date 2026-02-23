"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type { UserUiThemeUpdateInput } from "@/app/lib/models/settings/user-ui-theme.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { userUiThemeService } from "@/app/lib/services/settings/user-ui-theme.service"

const PERSONAL_DATA_STALE_TIME_MS = 1000 * 60 * 10
const PERSONAL_DATA_CACHE_TIME_MS = 1000 * 60 * 20

export function getUserUiThemeQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.settings.userUiTheme.detail(),
    queryFn: ({ signal }) => userUiThemeService.getUserUiTheme({ signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
  })
}

export function useUserUiThemeQuery() {
  return useQuery(getUserUiThemeQueryOptions())
}

export function useUpdateUserUiThemeMutation() {
  return useDomainMutation({
    domain: "settings",
    mutationFn: (input: UserUiThemeUpdateInput) =>
      userUiThemeService.updateUserUiTheme(input),
  })
}
