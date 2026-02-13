import type {
  CompanyCatalogCreateInput,
  CompanyCatalogDeleteResponse,
  CompanyCatalogEntity,
  CompanyCatalogListResponse,
  CompanyCatalogUpdateInput,
} from "@/app/lib/models/companies/company-catalog.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListCompanyCatalogOptions {
  limit?: number
  search?: string
  signal?: AbortSignal
}

export interface GetCompanyCatalogOptions {
  signal?: AbortSignal
}

export interface CreateCompanyCatalogOptions {
  signal?: AbortSignal
}

export interface UpdateCompanyCatalogOptions {
  signal?: AbortSignal
}

export interface DeleteCompanyCatalogOptions {
  signal?: AbortSignal
}

async function listCompanyCatalog(options: ListCompanyCatalogOptions = {}) {
  return apiClient.get<CompanyCatalogListResponse>("/companies/catalog", {
    query: {
      limit: options.limit ?? 50,
      search: options.search,
    },
    signal: options.signal,
  })
}

async function getCompanyCatalog(companyId: string, options: GetCompanyCatalogOptions = {}) {
  return apiClient.get<CompanyCatalogEntity>(`/companies/catalog/${companyId}`, {
    signal: options.signal,
  })
}

async function createCompanyCatalog(
  input: CompanyCatalogCreateInput,
  options: CreateCompanyCatalogOptions = {}
) {
  return apiClient.post<CompanyCatalogEntity>("/companies/catalog", {
    json: input,
    signal: options.signal,
  })
}

async function updateCompanyCatalog(
  companyId: string,
  input: CompanyCatalogUpdateInput,
  options: UpdateCompanyCatalogOptions = {}
) {
  return apiClient.patch<CompanyCatalogEntity>(`/companies/catalog/${companyId}`, {
    json: input,
    signal: options.signal,
  })
}

async function deleteCompanyCatalog(
  companyId: string,
  options: DeleteCompanyCatalogOptions = {}
) {
  return apiClient.delete<CompanyCatalogDeleteResponse>(`/companies/catalog/${companyId}`, {
    signal: options.signal,
  })
}

export const companyCatalogService = {
  listCompanyCatalog,
  getCompanyCatalog,
  createCompanyCatalog,
  updateCompanyCatalog,
  deleteCompanyCatalog,
}
