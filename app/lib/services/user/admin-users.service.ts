import type { AdminUsersResponse } from "@/app/lib/models/user/user.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface GetAdminUsersOptions {
  limit?: number
  signal?: AbortSignal
}

async function getAdminUsers(options: GetAdminUsersOptions = {}) {
  return apiClient.get<AdminUsersResponse>("/admin/users", {
    query: {
      limit: options.limit ?? 50,
    },
    signal: options.signal,
  })
}

export const adminUsersService = {
  getAdminUsers,
}
