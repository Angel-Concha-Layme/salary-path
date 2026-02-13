"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  PersonaBonusRulesCreateInput,
  PersonaBonusRulesUpdateInput,
} from "@/app/lib/models/comparison/persona-bonus-rules.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { personaBonusRulesService } from "@/app/lib/services/comparison/persona-bonus-rules.service"

export interface UsePersonaBonusRulesListParams {
  limit?: number
}

export function getPersonaBonusRulesListQueryOptions(
  personaId: string,
  params: UsePersonaBonusRulesListParams = {}
) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.comparison.personas.bonusRules.list(personaId, { limit }),
    queryFn: ({ signal }) => personaBonusRulesService.listPersonaBonusRules(personaId, { limit, signal }),
    staleTime: 1000 * 30,
    enabled: Boolean(personaId),
  })
}

export function getPersonaBonusRuleDetailQueryOptions(personaId: string, ruleId: string) {
  return queryOptions({
    queryKey: queryKeys.comparison.personas.bonusRules.detail(personaId, ruleId),
    queryFn: ({ signal }) => personaBonusRulesService.getPersonaBonusRule(personaId, ruleId, { signal }),
    staleTime: 1000 * 30,
    enabled: Boolean(personaId && ruleId),
  })
}

export function usePersonaBonusRulesListQuery(
  personaId: string,
  params: UsePersonaBonusRulesListParams = {}
) {
  return useQuery(getPersonaBonusRulesListQueryOptions(personaId, params))
}

export function usePersonaBonusRuleDetailQuery(personaId: string, ruleId: string) {
  return useQuery(getPersonaBonusRuleDetailQueryOptions(personaId, ruleId))
}

export function useCreatePersonaBonusRuleMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      input,
    }: {
      personaId: string
      input: PersonaBonusRulesCreateInput
    }) => personaBonusRulesService.createPersonaBonusRule(personaId, input),
  })
}

export function useUpdatePersonaBonusRuleMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      ruleId,
      input,
    }: {
      personaId: string
      ruleId: string
      input: PersonaBonusRulesUpdateInput
    }) => personaBonusRulesService.updatePersonaBonusRule(personaId, ruleId, input),
  })
}

export function useDeletePersonaBonusRuleMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({ personaId, ruleId }: { personaId: string; ruleId: string }) =>
      personaBonusRulesService.deletePersonaBonusRule(personaId, ruleId),
  })
}
