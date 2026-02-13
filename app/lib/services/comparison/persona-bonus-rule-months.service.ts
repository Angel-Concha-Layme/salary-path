import type {
  PersonaBonusRuleMonthsCreateInput,
  PersonaBonusRuleMonthsDeleteResponse,
  PersonaBonusRuleMonthsEntity,
  PersonaBonusRuleMonthsListResponse,
  PersonaBonusRuleMonthsUpdateInput,
} from "@/app/lib/models/comparison/persona-bonus-rule-months.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListPersonaBonusRuleMonthsOptions {
  limit?: number
  signal?: AbortSignal
}

export interface GetPersonaBonusRuleMonthOptions {
  signal?: AbortSignal
}

export interface CreatePersonaBonusRuleMonthOptions {
  signal?: AbortSignal
}

export interface UpdatePersonaBonusRuleMonthOptions {
  signal?: AbortSignal
}

export interface DeletePersonaBonusRuleMonthOptions {
  signal?: AbortSignal
}

async function listPersonaBonusRuleMonths(
  personaId: string,
  ruleId: string,
  options: ListPersonaBonusRuleMonthsOptions = {}
) {
  return apiClient.get<PersonaBonusRuleMonthsListResponse>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}/months`,
    {
      query: {
        limit: options.limit ?? 50,
      },
      signal: options.signal,
    }
  )
}

async function getPersonaBonusRuleMonth(
  personaId: string,
  ruleId: string,
  monthId: string,
  options: GetPersonaBonusRuleMonthOptions = {}
) {
  return apiClient.get<PersonaBonusRuleMonthsEntity>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}/months/${monthId}`,
    {
      signal: options.signal,
    }
  )
}

async function createPersonaBonusRuleMonth(
  personaId: string,
  ruleId: string,
  input: PersonaBonusRuleMonthsCreateInput,
  options: CreatePersonaBonusRuleMonthOptions = {}
) {
  return apiClient.post<PersonaBonusRuleMonthsEntity>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}/months`,
    {
      json: input,
      signal: options.signal,
    }
  )
}

async function updatePersonaBonusRuleMonth(
  personaId: string,
  ruleId: string,
  monthId: string,
  input: PersonaBonusRuleMonthsUpdateInput,
  options: UpdatePersonaBonusRuleMonthOptions = {}
) {
  return apiClient.patch<PersonaBonusRuleMonthsEntity>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}/months/${monthId}`,
    {
      json: input,
      signal: options.signal,
    }
  )
}

async function deletePersonaBonusRuleMonth(
  personaId: string,
  ruleId: string,
  monthId: string,
  options: DeletePersonaBonusRuleMonthOptions = {}
) {
  return apiClient.delete<PersonaBonusRuleMonthsDeleteResponse>(
    `/comparison/personas/${personaId}/bonus-rules/${ruleId}/months/${monthId}`,
    {
      signal: options.signal,
    }
  )
}

export const personaBonusRuleMonthsService = {
  listPersonaBonusRuleMonths,
  getPersonaBonusRuleMonth,
  createPersonaBonusRuleMonth,
  updatePersonaBonusRuleMonth,
  deletePersonaBonusRuleMonth,
}
