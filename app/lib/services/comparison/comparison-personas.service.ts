import type {
  ComparisonPersonasCreateInput,
  ComparisonPersonasDeleteResponse,
  ComparisonPersonasEntity,
  ComparisonPersonasListResponse,
  ComparisonPersonasUpdateInput,
} from "@/app/lib/models/comparison/comparison-personas.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListComparisonPersonasOptions {
  limit?: number
  signal?: AbortSignal
}

export interface GetComparisonPersonaOptions {
  signal?: AbortSignal
}

export interface CreateComparisonPersonaOptions {
  signal?: AbortSignal
}

export interface UpdateComparisonPersonaOptions {
  signal?: AbortSignal
}

export interface DeleteComparisonPersonaOptions {
  signal?: AbortSignal
}

async function listComparisonPersonas(options: ListComparisonPersonasOptions = {}) {
  return apiClient.get<ComparisonPersonasListResponse>("/comparison/personas", {
    query: {
      limit: options.limit ?? 50,
    },
    signal: options.signal,
  })
}

async function getComparisonPersona(personaId: string, options: GetComparisonPersonaOptions = {}) {
  return apiClient.get<ComparisonPersonasEntity>(`/comparison/personas/${personaId}`, {
    signal: options.signal,
  })
}

async function createComparisonPersona(
  input: ComparisonPersonasCreateInput,
  options: CreateComparisonPersonaOptions = {}
) {
  return apiClient.post<ComparisonPersonasEntity>("/comparison/personas", {
    json: input,
    signal: options.signal,
  })
}

async function updateComparisonPersona(
  personaId: string,
  input: ComparisonPersonasUpdateInput,
  options: UpdateComparisonPersonaOptions = {}
) {
  return apiClient.patch<ComparisonPersonasEntity>(`/comparison/personas/${personaId}`, {
    json: input,
    signal: options.signal,
  })
}

async function deleteComparisonPersona(
  personaId: string,
  options: DeleteComparisonPersonaOptions = {}
) {
  return apiClient.delete<ComparisonPersonasDeleteResponse>(`/comparison/personas/${personaId}`, {
    signal: options.signal,
  })
}

export const comparisonPersonasService = {
  listComparisonPersonas,
  getComparisonPersona,
  createComparisonPersona,
  updateComparisonPersona,
  deleteComparisonPersona,
}
