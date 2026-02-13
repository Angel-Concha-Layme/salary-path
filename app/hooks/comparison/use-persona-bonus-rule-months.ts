"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  PersonaBonusRuleMonthsCreateInput,
  PersonaBonusRuleMonthsUpdateInput,
} from "@/app/lib/models/comparison/persona-bonus-rule-months.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { personaBonusRuleMonthsService } from "@/app/lib/services/comparison/persona-bonus-rule-months.service"

export interface UsePersonaBonusRuleMonthsListParams {
  limit?: number
}

export function getPersonaBonusRuleMonthsListQueryOptions(
  personaId: string,
  ruleId: string,
  params: UsePersonaBonusRuleMonthsListParams = {}
) {
  const limit = params.limit ?? 50

  return queryOptions({
    queryKey: queryKeys.comparison.personas.bonusRules.months.list(personaId, ruleId, {
      limit,
    }),
    queryFn: ({ signal }) =>
      personaBonusRuleMonthsService.listPersonaBonusRuleMonths(personaId, ruleId, {
        limit,
        signal,
      }),
    staleTime: 1000 * 30,
    enabled: Boolean(personaId && ruleId),
  })
}

export function getPersonaBonusRuleMonthDetailQueryOptions(
  personaId: string,
  ruleId: string,
  monthId: string
) {
  return queryOptions({
    queryKey: queryKeys.comparison.personas.bonusRules.months.detail(personaId, ruleId, monthId),
    queryFn: ({ signal }) =>
      personaBonusRuleMonthsService.getPersonaBonusRuleMonth(personaId, ruleId, monthId, {
        signal,
      }),
    staleTime: 1000 * 30,
    enabled: Boolean(personaId && ruleId && monthId),
  })
}

export function usePersonaBonusRuleMonthsListQuery(
  personaId: string,
  ruleId: string,
  params: UsePersonaBonusRuleMonthsListParams = {}
) {
  return useQuery(getPersonaBonusRuleMonthsListQueryOptions(personaId, ruleId, params))
}

export function usePersonaBonusRuleMonthDetailQuery(
  personaId: string,
  ruleId: string,
  monthId: string
) {
  return useQuery(getPersonaBonusRuleMonthDetailQueryOptions(personaId, ruleId, monthId))
}

export function useCreatePersonaBonusRuleMonthMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      ruleId,
      input,
    }: {
      personaId: string
      ruleId: string
      input: PersonaBonusRuleMonthsCreateInput
    }) => personaBonusRuleMonthsService.createPersonaBonusRuleMonth(personaId, ruleId, input),
  })
}

export function useUpdatePersonaBonusRuleMonthMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      ruleId,
      monthId,
      input,
    }: {
      personaId: string
      ruleId: string
      monthId: string
      input: PersonaBonusRuleMonthsUpdateInput
    }) => personaBonusRuleMonthsService.updatePersonaBonusRuleMonth(personaId, ruleId, monthId, input),
  })
}

export function useDeletePersonaBonusRuleMonthMutation() {
  return useDomainMutation({
    domain: "comparison",
    mutationFn: ({
      personaId,
      ruleId,
      monthId,
    }: {
      personaId: string
      ruleId: string
      monthId: string
    }) => personaBonusRuleMonthsService.deletePersonaBonusRuleMonth(personaId, ruleId, monthId),
  })
}
