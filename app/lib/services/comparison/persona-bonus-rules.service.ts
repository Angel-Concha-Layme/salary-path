import type {
  PersonaBonusRulesCreateInput,
  PersonaBonusRulesDeleteResponse,
  PersonaBonusRulesEntity,
  PersonaBonusRulesListResponse,
  PersonaBonusRulesUpdateInput,
} from "@/app/lib/models/comparison/persona-bonus-rules.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListPersonaBonusRulesOptions {
  limit?: number
  signal?: AbortSignal
}

export interface GetPersonaBonusRuleOptions {
  signal?: AbortSignal
}

export interface CreatePersonaBonusRuleOptions {
  signal?: AbortSignal
}

export interface UpdatePersonaBonusRuleOptions {
  signal?: AbortSignal
}

export interface DeletePersonaBonusRuleOptions {
  signal?: AbortSignal
}

async function listPersonaBonusRules(
  personaId: string,
  options: ListPersonaBonusRulesOptions = {}
) {
  return apiClient.get<PersonaBonusRulesListResponse>(`/comparison/personas/${personaId}/bonus-rules`, {
    query: {
      limit: options.limit ?? 50,
    },
    signal: options.signal,
  })
}

async function getPersonaBonusRule(
  personaId: string,
  ruleId: string,
  options: GetPersonaBonusRuleOptions = {}
) {
  return apiClient.get<PersonaBonusRulesEntity>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}`,
    {
      signal: options.signal,
    }
  )
}

async function createPersonaBonusRule(
  personaId: string,
  input: PersonaBonusRulesCreateInput,
  options: CreatePersonaBonusRuleOptions = {}
) {
  return apiClient.post<PersonaBonusRulesEntity>(`/comparison/personas/${personaId}/bonus-rules`, {
    json: input,
    signal: options.signal,
  })
}

async function updatePersonaBonusRule(
  personaId: string,
  ruleId: string,
  input: PersonaBonusRulesUpdateInput,
  options: UpdatePersonaBonusRuleOptions = {}
) {
  return apiClient.patch<PersonaBonusRulesEntity>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}`,
    {
      json: input,
      signal: options.signal,
    }
  )
}

async function deletePersonaBonusRule(
  personaId: string,
  ruleId: string,
  options: DeletePersonaBonusRuleOptions = {}
) {
  return apiClient.delete<PersonaBonusRulesDeleteResponse>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}`,
    {
      signal: options.signal,
    }
  )
}

export const personaBonusRulesService = {
  listPersonaBonusRules,
  getPersonaBonusRule,
  createPersonaBonusRule,
  updatePersonaBonusRule,
  deletePersonaBonusRule,
}
