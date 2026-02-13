"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/app/lib/services/query-keys"
import { adminUsersService } from "@/app/lib/services/user/admin-users.service"

export interface UseAdminUsersQueryParams {
  limit?: number
}

export function getAdminUsersQueryOptions(params: UseAdminUsersQueryParams = {}) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.adminUsers.list({ limit }),
    queryFn: ({ signal }) => adminUsersService.getAdminUsers({ limit, signal }),
    staleTime: 1000 * 30,
  })
}

export function useAdminUsersQuery(params: UseAdminUsersQueryParams = {}) {
  return useQuery(getAdminUsersQueryOptions(params))
}
