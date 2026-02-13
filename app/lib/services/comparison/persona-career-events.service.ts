import type {
  PersonaCareerEventsCreateInput,
  PersonaCareerEventsDeleteResponse,
  PersonaCareerEventsEntity,
  PersonaCareerEventsListResponse,
  PersonaCareerEventsUpdateInput,
} from "@/app/lib/models/comparison/persona-career-events.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListPersonaCareerEventsOptions {
  limit?: number
  signal?: AbortSignal
}

export interface GetPersonaCareerEventOptions {
  signal?: AbortSignal
}

export interface CreatePersonaCareerEventOptions {
  signal?: AbortSignal
}

export interface UpdatePersonaCareerEventOptions {
  signal?: AbortSignal
}

export interface DeletePersonaCareerEventOptions {
  signal?: AbortSignal
}

async function listPersonaCareerEvents(
  personaId: string,
  options: ListPersonaCareerEventsOptions = {}
) {
  return apiClient.get<PersonaCareerEventsListResponse>(
    `/comparison/personas/${personaId}/career-events`,
    {
      query: {
        limit: options.limit ?? 50,
      },
      signal: options.signal,
    }
  )
}

async function getPersonaCareerEvent(
  personaId: string,
  eventId: string,
  options: GetPersonaCareerEventOptions = {}
) {
  return apiClient.get<PersonaCareerEventsEntity>(
    `/comparison/personas/${personaId}/career-events/${eventId}`,
    {
      signal: options.signal,
    }
  )
}

async function createPersonaCareerEvent(
  personaId: string,
  input: PersonaCareerEventsCreateInput,
  options: CreatePersonaCareerEventOptions = {}
) {
  return apiClient.post<PersonaCareerEventsEntity>(`/comparison/personas/${personaId}/career-events`, {
    json: input,
    signal: options.signal,
  })
}

async function updatePersonaCareerEvent(
  personaId: string,
  eventId: string,
  input: PersonaCareerEventsUpdateInput,
  options: UpdatePersonaCareerEventOptions = {}
) {
  return apiClient.patch<PersonaCareerEventsEntity>(
    `/comparison/personas/${personaId}/career-events/${eventId}`,
    {
      json: input,
      signal: options.signal,
    }
  )
}

async function deletePersonaCareerEvent(
  personaId: string,
  eventId: string,
  options: DeletePersonaCareerEventOptions = {}
) {
  return apiClient.delete<PersonaCareerEventsDeleteResponse>(
    `/comparison/personas/${personaId}/career-events/${eventId}`,
    {
      signal: options.signal,
    }
  )
}

export const personaCareerEventsService = {
  listPersonaCareerEvents,
  getPersonaCareerEvent,
  createPersonaCareerEvent,
  updatePersonaCareerEvent,
  deletePersonaCareerEvent,
}
