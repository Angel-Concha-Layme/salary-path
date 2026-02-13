import type {
  UserFinanceSettingsCreateInput,
  UserFinanceSettingsDeleteResponse,
  UserFinanceSettingsEntity,
  UserFinanceSettingsListResponse,
  UserFinanceSettingsUpdateInput,
} from "@/app/lib/models/settings/user-finance-settings.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListUserFinanceSettingsOptions {
  limit?: number
  signal?: AbortSignal
}

export interface GetUserFinanceSettingsOptions {
  signal?: AbortSignal
}

export interface CreateUserFinanceSettingsOptions {
  signal?: AbortSignal
}

export interface UpdateUserFinanceSettingsOptions {
  signal?: AbortSignal
}

export interface DeleteUserFinanceSettingsOptions {
  signal?: AbortSignal
}

async function listUserFinanceSettings(options: ListUserFinanceSettingsOptions = {}) {
  return apiClient.get<UserFinanceSettingsListResponse>("/settings/finance", {
    query: {
      limit: options.limit ?? 50,
    },
    signal: options.signal,
  })
}

async function getUserFinanceSettings(id: string, options: GetUserFinanceSettingsOptions = {}) {
  return apiClient.get<UserFinanceSettingsEntity>(`/settings/finance/${id}`, {
    signal: options.signal,
  })
}

async function createUserFinanceSettings(
  input: UserFinanceSettingsCreateInput,
  options: CreateUserFinanceSettingsOptions = {}
) {
  return apiClient.post<UserFinanceSettingsEntity>("/settings/finance", {
    json: input,
    signal: options.signal,
  })
}

async function updateUserFinanceSettings(
  id: string,
  input: UserFinanceSettingsUpdateInput,
  options: UpdateUserFinanceSettingsOptions = {}
) {
  return apiClient.patch<UserFinanceSettingsEntity>(`/settings/finance/${id}`, {
    json: input,
    signal: options.signal,
  })
}

async function deleteUserFinanceSettings(
  id: string,
  options: DeleteUserFinanceSettingsOptions = {}
) {
  return apiClient.delete<UserFinanceSettingsDeleteResponse>(`/settings/finance/${id}`, {
    signal: options.signal,
  })
}

export const userFinanceSettingsService = {
  listUserFinanceSettings,
  getUserFinanceSettings,
  createUserFinanceSettings,
  updateUserFinanceSettings,
  deleteUserFinanceSettings,
}
