import type {
  PathCompanyEventsCreateInput,
  PathCompanyEventsDeleteResponse,
  PathCompanyEventsEntity,
  PathCompanyEventsListResponse,
  PathCompanyEventsUpdateInput,
} from "@/app/lib/models/personal-path/path-company-events.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListPathCompanyEventsOptions {
  limit?: number
  signal?: AbortSignal
}

export interface ListPathCompanyEventsByOwnerOptions {
  limit?: number
  signal?: AbortSignal
}

export interface GetPathCompanyEventOptions {
  signal?: AbortSignal
}

export interface CreatePathCompanyEventOptions {
  signal?: AbortSignal
}

export interface UpdatePathCompanyEventOptions {
  signal?: AbortSignal
}

export interface DeletePathCompanyEventOptions {
  signal?: AbortSignal
}

function hydratePathCompanyEventEntity(entity: PathCompanyEventsEntity): PathCompanyEventsEntity {
  return {
    ...entity,
    notes: entity.notes ?? null,
    deletedAt: entity.deletedAt ?? null,
  }
}

function hydratePathCompanyEventsListResponse(
  response: PathCompanyEventsListResponse
): PathCompanyEventsListResponse {
  return {
    ...response,
    items: response.items.map(hydratePathCompanyEventEntity),
  }
}

async function listPathCompanyEvents(
  pathCompanyId: string,
  options: ListPathCompanyEventsOptions = {}
) {
  const response = await apiClient.get<PathCompanyEventsListResponse>(
    `/personal-path/companies/${pathCompanyId}/events`,
    {
      query: {
        limit: options.limit ?? 50,
      },
      signal: options.signal,
    }
  )

  return hydratePathCompanyEventsListResponse(response)
}

async function listPathCompanyEventsByOwner(
  options: ListPathCompanyEventsByOwnerOptions = {}
) {
  const response = await apiClient.get<PathCompanyEventsListResponse>("/personal-path/company-events", {
    query: {
      limit: options.limit ?? 100,
    },
    signal: options.signal,
  })

  return hydratePathCompanyEventsListResponse(response)
}

async function getPathCompanyEvent(
  pathCompanyId: string,
  eventId: string,
  options: GetPathCompanyEventOptions = {}
) {
  const response = await apiClient.get<PathCompanyEventsEntity>(
    `/personal-path/companies/${pathCompanyId}/events/${eventId}`,
    {
      signal: options.signal,
    }
  )

  return hydratePathCompanyEventEntity(response)
}

async function createPathCompanyEvent(
  pathCompanyId: string,
  input: PathCompanyEventsCreateInput,
  options: CreatePathCompanyEventOptions = {}
) {
  const response = await apiClient.post<PathCompanyEventsEntity>(`/personal-path/companies/${pathCompanyId}/events`, {
    json: input,
    signal: options.signal,
  })

  return hydratePathCompanyEventEntity(response)
}

async function updatePathCompanyEvent(
  pathCompanyId: string,
  eventId: string,
  input: PathCompanyEventsUpdateInput,
  options: UpdatePathCompanyEventOptions = {}
) {
  const response = await apiClient.patch<PathCompanyEventsEntity>(
    `/personal-path/companies/${pathCompanyId}/events/${eventId}`,
    {
      json: input,
      signal: options.signal,
    }
  )

  return hydratePathCompanyEventEntity(response)
}

async function deletePathCompanyEvent(
  pathCompanyId: string,
  eventId: string,
  options: DeletePathCompanyEventOptions = {}
) {
  return apiClient.delete<PathCompanyEventsDeleteResponse>(
    `/personal-path/companies/${pathCompanyId}/events/${eventId}`,
    {
      signal: options.signal,
    }
  )
}

export const pathCompanyEventsService = {
  listPathCompanyEvents,
  listPathCompanyEventsByOwner,
  getPathCompanyEvent,
  createPathCompanyEvent,
  updatePathCompanyEvent,
  deletePathCompanyEvent,
}
