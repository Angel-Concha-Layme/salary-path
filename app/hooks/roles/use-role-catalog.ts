"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  RoleCatalogCreateInput,
  RoleCatalogUpdateInput,
} from "@/app/lib/models/roles/role-catalog.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { roleCatalogService } from "@/app/lib/services/roles/role-catalog.service"

export interface UseRoleCatalogListParams {
  limit?: number
  search?: string
  enabled?: boolean
}

export function getRoleCatalogListQueryOptions(params: UseRoleCatalogListParams = {}) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.roles.roleCatalog.list({
      limit,
      search: params.search,
    }),
    queryFn: ({ signal }) =>
      roleCatalogService.listRoleCatalog({
        limit,
        search: params.search,
        signal,
      }),
    staleTime: 1000 * 30,
    enabled: params.enabled ?? true,
  })
}

export function getRoleCatalogDetailQueryOptions(roleId: string) {
  return queryOptions({
    queryKey: queryKeys.roles.roleCatalog.detail(roleId),
    queryFn: ({ signal }) => roleCatalogService.getRoleCatalog(roleId, { signal }),
    staleTime: 1000 * 30,
    enabled: Boolean(roleId),
  })
}

export function useRoleCatalogListQuery(params: UseRoleCatalogListParams = {}) {
  return useQuery(getRoleCatalogListQueryOptions(params))
}

export function useRoleCatalogDetailQuery(roleId: string) {
  return useQuery(getRoleCatalogDetailQueryOptions(roleId))
}

export function useCreateRoleCatalogMutation() {
  return useDomainMutation({
    domain: "roles",
    mutationFn: (input: RoleCatalogCreateInput) => roleCatalogService.createRoleCatalog(input),
  })
}

export function useUpdateRoleCatalogMutation() {
  return useDomainMutation({
    domain: "roles",
    mutationFn: ({
      roleId,
      input,
    }: {
      roleId: string
      input: RoleCatalogUpdateInput
    }) => roleCatalogService.updateRoleCatalog(roleId, input),
  })
}

export function useDeleteRoleCatalogMutation() {
  return useDomainMutation({
    domain: "roles",
    mutationFn: (roleId: string) => roleCatalogService.deleteRoleCatalog(roleId),
  })
}
