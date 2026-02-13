"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  PersonaCareerEventsCreateInput,
  PersonaCareerEventsUpdateInput,
} from "@/app/lib/models/comparison/persona-career-events.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { personaCareerEventsService } from "@/app/lib/services/comparison/persona-career-events.service"

export interface UsePersonaCareerEventsListParams {
  limit?: number
}

export function getPersonaCareerEventsListQueryOptions(
  personaId: string,
  params: UsePersonaCareerEventsListParams = {}
) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.comparison.personas.careerEvents.list(personaId, { limit }),
    queryFn: ({ signal }) => personaCareerEventsService.listPersonaCareerEvents(personaId, { limit, signal }),
    staleTime: 1000 * 30,
    enabled: Boolean(personaId),
  })
}

export function getPersonaCareerEventDetailQueryOptions(personaId: string, eventId: string) {
  return queryOptions({
    queryKey: queryKeys.comparison.personas.careerEvents.detail(personaId, eventId),
    queryFn: ({ signal }) =>
      personaCareerEventsService.getPersonaCareerEvent(personaId, eventId, { signal }),
    staleTime: 1000 * 30,
    enabled: Boolean(personaId && eventId),
  })
}

export function usePersonaCareerEventsListQuery(
  personaId: string,
  params: UsePersonaCareerEventsListParams = {}
) {
  return useQuery(getPersonaCareerEventsListQueryOptions(personaId, params))
}

export function usePersonaCareerEventDetailQuery(personaId: string, eventId: string) {
  return useQuery(getPersonaCareerEventDetailQueryOptions(personaId, eventId))
}

export function useCreatePersonaCareerEventMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      input,
    }: {
      personaId: string
      input: PersonaCareerEventsCreateInput
    }) => personaCareerEventsService.createPersonaCareerEvent(personaId, input),
  })
}

export function useUpdatePersonaCareerEventMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      eventId,
      input,
    }: {
      personaId: string
      eventId: string
      input: PersonaCareerEventsUpdateInput
    }) => personaCareerEventsService.updatePersonaCareerEvent(personaId, eventId, input),
  })
}

export function useDeletePersonaCareerEventMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({ personaId, eventId }: { personaId: string; eventId: string }) =>
      personaCareerEventsService.deletePersonaCareerEvent(personaId, eventId),
  })
}
