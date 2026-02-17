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

function hydrateUserFinanceSettingsEntity(entity: UserFinanceSettingsEntity): UserFinanceSettingsEntity {
  return {
    ...entity,
    deletedAt: entity.deletedAt ?? null,
  }
}

function hydrateUserFinanceSettingsListResponse(
  response: UserFinanceSettingsListResponse
): UserFinanceSettingsListResponse {
  return {
    ...response,
    items: response.items.map(hydrateUserFinanceSettingsEntity),
  }
}

async function listUserFinanceSettings(options: ListUserFinanceSettingsOptions = {}) {
  const response = await apiClient.get<UserFinanceSettingsListResponse>("/settings/finance", {
    query: {
      limit: options.limit ?? 50,
    },
    signal: options.signal,
  })

  return hydrateUserFinanceSettingsListResponse(response)
}

async function getUserFinanceSettings(id: string, options: GetUserFinanceSettingsOptions = {}) {
  const response = await apiClient.get<UserFinanceSettingsEntity>(`/settings/finance/${id}`, {
    signal: options.signal,
  })

  return hydrateUserFinanceSettingsEntity(response)
}

async function createUserFinanceSettings(
  input: UserFinanceSettingsCreateInput,
  options: CreateUserFinanceSettingsOptions = {}
) {
  const response = await apiClient.post<UserFinanceSettingsEntity>("/settings/finance", {
    json: input,
    signal: options.signal,
  })

  return hydrateUserFinanceSettingsEntity(response)
}

async function updateUserFinanceSettings(
  id: string,
  input: UserFinanceSettingsUpdateInput,
  options: UpdateUserFinanceSettingsOptions = {}
) {
  const response = await apiClient.patch<UserFinanceSettingsEntity>(`/settings/finance/${id}`, {
    json: input,
    signal: options.signal,
  })

  return hydrateUserFinanceSettingsEntity(response)
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
