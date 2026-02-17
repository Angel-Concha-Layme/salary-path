import type {
  PathCompaniesCreateInput,
  PathCompaniesDeleteResponse,
  PathCompaniesEntity,
  PathCompaniesListResponse,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListPathCompaniesOptions {
  limit?: number
  signal?: AbortSignal
}

export interface GetPathCompanyOptions {
  signal?: AbortSignal
}

export interface CreatePathCompanyOptions {
  signal?: AbortSignal
}

export interface UpdatePathCompanyOptions {
  signal?: AbortSignal
}

export interface DeletePathCompanyOptions {
  signal?: AbortSignal
}

function hydratePathCompanyEntity(entity: PathCompaniesEntity): PathCompaniesEntity {
  return {
    ...entity,
    companyCatalogId: entity.companyCatalogId ?? null,
    roleCatalogId: entity.roleCatalogId ?? null,
    endDate: entity.endDate ?? null,
    deletedAt: entity.deletedAt ?? null,
  }
}

function hydratePathCompaniesListResponse(
  response: PathCompaniesListResponse
): PathCompaniesListResponse {
  return {
    ...response,
    items: response.items.map(hydratePathCompanyEntity),
  }
}

async function listPathCompanies(options: ListPathCompaniesOptions = {}) {
  const response = await apiClient.get<PathCompaniesListResponse>("/personal-path/companies", {
    query: {
      limit: options.limit ?? 50,
    },
    signal: options.signal,
  })

  return hydratePathCompaniesListResponse(response)
}

async function getPathCompany(pathCompanyId: string, options: GetPathCompanyOptions = {}) {
  const response = await apiClient.get<PathCompaniesEntity>(`/personal-path/companies/${pathCompanyId}`, {
    signal: options.signal,
  })

  return hydratePathCompanyEntity(response)
}

async function createPathCompany(
  input: PathCompaniesCreateInput,
  options: CreatePathCompanyOptions = {}
) {
  const response = await apiClient.post<PathCompaniesEntity>("/personal-path/companies", {
    json: input,
    signal: options.signal,
  })

  return hydratePathCompanyEntity(response)
}

async function updatePathCompany(
  pathCompanyId: string,
  input: PathCompaniesUpdateInput,
  options: UpdatePathCompanyOptions = {}
) {
  const response = await apiClient.patch<PathCompaniesEntity>(`/personal-path/companies/${pathCompanyId}`, {
    json: input,
    signal: options.signal,
  })

  return hydratePathCompanyEntity(response)
}

async function deletePathCompany(
  pathCompanyId: string,
  options: DeletePathCompanyOptions = {}
) {
  return apiClient.delete<PathCompaniesDeleteResponse>(`/personal-path/companies/${pathCompanyId}`, {
    signal: options.signal,
  })
}

export const pathCompaniesService = {
  listPathCompanies,
  getPathCompany,
  createPathCompany,
  updatePathCompany,
  deletePathCompany,
}
