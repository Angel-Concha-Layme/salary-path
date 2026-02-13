"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  ComparisonPersonasCreateInput,
  ComparisonPersonasUpdateInput,
} from "@/app/lib/models/comparison/comparison-personas.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { comparisonPersonasService } from "@/app/lib/services/comparison/comparison-personas.service"

export interface UseComparisonPersonasListParams {
  limit?: number
}

export function getComparisonPersonasListQueryOptions(
  params: UseComparisonPersonasListParams = {}
) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.comparison.personas.list({ limit }),
    queryFn: ({ signal }) => comparisonPersonasService.listComparisonPersonas({ limit, signal }),
    staleTime: 1000 * 30,
  })
}

export function getComparisonPersonaDetailQueryOptions(personaId: string) {
  return queryOptions({
    queryKey: queryKeys.comparison.personas.detail(personaId),
    queryFn: ({ signal }) => comparisonPersonasService.getComparisonPersona(personaId, { signal }),
    staleTime: 1000 * 30,
    enabled: Boolean(personaId),
  })
}

export function useComparisonPersonasListQuery(params: UseComparisonPersonasListParams = {}) {
  return useQuery(getComparisonPersonasListQueryOptions(params))
}

export function useComparisonPersonaDetailQuery(personaId: string) {
  return useQuery(getComparisonPersonaDetailQueryOptions(personaId))
}

export function useCreateComparisonPersonaMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: (input: ComparisonPersonasCreateInput) =>
      comparisonPersonasService.createComparisonPersona(input),
  })
}

export function useUpdateComparisonPersonaMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      input,
    }: {
      personaId: string
      input: ComparisonPersonasUpdateInput
    }) => comparisonPersonasService.updateComparisonPersona(personaId, input),
  })
}

export function useDeleteComparisonPersonaMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: (personaId: string) => comparisonPersonasService.deleteComparisonPersona(personaId),
  })
}
