"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  UserFinanceSettingsCreateInput,
  UserFinanceSettingsUpdateInput,
} from "@/app/lib/models/settings/user-finance-settings.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { userFinanceSettingsService } from "@/app/lib/services/settings/user-finance-settings.service"

export interface UseUserFinanceSettingsListParams {
  limit?: number
}

export function getUserFinanceSettingsListQueryOptions(
  params: UseUserFinanceSettingsListParams = {}
) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.settings.userFinanceSettings.list({ limit }),
    queryFn: ({ signal }) => userFinanceSettingsService.listUserFinanceSettings({ limit, signal }),
    staleTime: 1000 * 30,
  })
}

export function getUserFinanceSettingsDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.settings.userFinanceSettings.detail(id),
    queryFn: ({ signal }) => userFinanceSettingsService.getUserFinanceSettings(id, { signal }),
    staleTime: 1000 * 30,
    enabled: Boolean(id),
  })
}

export function useUserFinanceSettingsListQuery(params: UseUserFinanceSettingsListParams = {}) {
  return useQuery(getUserFinanceSettingsListQueryOptions(params))
}

export function useUserFinanceSettingsDetailQuery(id: string) {
  return useQuery(getUserFinanceSettingsDetailQueryOptions(id))
}

export function useCreateUserFinanceSettingsMutation() {
  return useDomainMutation({
    domain: "settings",
    mutationFn: (input: UserFinanceSettingsCreateInput) =>
      userFinanceSettingsService.createUserFinanceSettings(input),
  })
}

export function useUpdateUserFinanceSettingsMutation() {
  return useDomainMutation({
    domain: "settings",
    mutationFn: ({ id, input }: { id: string; input: UserFinanceSettingsUpdateInput }) =>
      userFinanceSettingsService.updateUserFinanceSettings(id, input),
  })
}

export function useDeleteUserFinanceSettingsMutation() {
  return useDomainMutation({
    domain: "settings",
    mutationFn: (id: string) => userFinanceSettingsService.deleteUserFinanceSettings(id),
  })
}
