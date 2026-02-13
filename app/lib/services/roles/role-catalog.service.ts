import type {
  RoleCatalogCreateInput,
  RoleCatalogDeleteResponse,
  RoleCatalogEntity,
  RoleCatalogListResponse,
  RoleCatalogUpdateInput,
} from "@/app/lib/models/roles/role-catalog.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListRoleCatalogOptions {
  limit?: number
  search?: string
  signal?: AbortSignal
}

export interface GetRoleCatalogOptions {
  signal?: AbortSignal
}

export interface CreateRoleCatalogOptions {
  signal?: AbortSignal
}

export interface UpdateRoleCatalogOptions {
  signal?: AbortSignal
}

export interface DeleteRoleCatalogOptions {
  signal?: AbortSignal
}

async function listRoleCatalog(options: ListRoleCatalogOptions = {}) {
  return apiClient.get<RoleCatalogListResponse>("/roles/catalog", {
    query: {
      limit: options.limit ?? 50,
      search: options.search,
    },
    signal: options.signal,
  })
}

async function getRoleCatalog(roleId: string, options: GetRoleCatalogOptions = {}) {
  return apiClient.get<RoleCatalogEntity>(`/roles/catalog/${roleId}`, {
    signal: options.signal,
  })
}

async function createRoleCatalog(
  input: RoleCatalogCreateInput,
  options: CreateRoleCatalogOptions = {}
) {
  return apiClient.post<RoleCatalogEntity>("/roles/catalog", {
    json: input,
    signal: options.signal,
  })
}

async function updateRoleCatalog(
  roleId: string,
  input: RoleCatalogUpdateInput,
  options: UpdateRoleCatalogOptions = {}
) {
  return apiClient.patch<RoleCatalogEntity>(`/roles/catalog/${roleId}`, {
    json: input,
    signal: options.signal,
  })
}

async function deleteRoleCatalog(
  roleId: string,
  options: DeleteRoleCatalogOptions = {}
) {
  return apiClient.delete<RoleCatalogDeleteResponse>(`/roles/catalog/${roleId}`, {
    signal: options.signal,
  })
}

export const roleCatalogService = {
  listRoleCatalog,
  getRoleCatalog,
  createRoleCatalog,
  updateRoleCatalog,
  deleteRoleCatalog,
}
