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

async function listPathCompanies(options: ListPathCompaniesOptions = {}) {
  return apiClient.get<PathCompaniesListResponse>("/personal-path/companies", {
    query: {
      limit: options.limit ?? 50,
    },
    signal: options.signal,
  })
}

async function getPathCompany(pathCompanyId: string, options: GetPathCompanyOptions = {}) {
  return apiClient.get<PathCompaniesEntity>(`/personal-path/companies/${pathCompanyId}`, {
    signal: options.signal,
  })
}

async function createPathCompany(
  input: PathCompaniesCreateInput,
  options: CreatePathCompanyOptions = {}
) {
  return apiClient.post<PathCompaniesEntity>("/personal-path/companies", {
    json: input,
    signal: options.signal,
  })
}

async function updatePathCompany(
  pathCompanyId: string,
  input: PathCompaniesUpdateInput,
  options: UpdatePathCompanyOptions = {}
) {
  return apiClient.patch<PathCompaniesEntity>(`/personal-path/companies/${pathCompanyId}`, {
    json: input,
    signal: options.signal,
  })
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
