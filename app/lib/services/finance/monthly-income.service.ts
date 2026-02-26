import type {
  MonthlyIncomeListResponse,
  MonthlyIncomeRangePreset,
  MonthlyIncomeSource,
  MonthlyIncomeSourceCreateInput,
  MonthlyIncomeSourceDeleteResponse,
  MonthlyIncomeSourceUpdateInput,
} from "@/app/lib/models/finance/monthly-income.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface ListMonthlyIncomeOptions {
  range?: MonthlyIncomeRangePreset
  signal?: AbortSignal
}

export interface CreateMonthlyIncomeSourceOptions {
  signal?: AbortSignal
}

export interface UpdateMonthlyIncomeSourceOptions {
  signal?: AbortSignal
}

export interface DeleteMonthlyIncomeSourceOptions {
  signal?: AbortSignal
}

async function listMonthlyIncome(options: ListMonthlyIncomeOptions = {}) {
  return apiClient.get<MonthlyIncomeListResponse>("/finance/monthly-income", {
    query: {
      range: options.range ?? "all",
    },
    signal: options.signal,
  })
}

async function createMonthlyIncomeSource(
  input: MonthlyIncomeSourceCreateInput,
  options: CreateMonthlyIncomeSourceOptions = {}
) {
  return apiClient.post<MonthlyIncomeSource>("/finance/monthly-income/sources", {
    json: input,
    signal: options.signal,
  })
}

async function updateMonthlyIncomeSource(
  sourceId: string,
  input: MonthlyIncomeSourceUpdateInput,
  options: UpdateMonthlyIncomeSourceOptions = {}
) {
  return apiClient.patch<MonthlyIncomeSource>(`/finance/monthly-income/sources/${sourceId}`, {
    json: input,
    signal: options.signal,
  })
}

async function deleteMonthlyIncomeSource(
  sourceId: string,
  options: DeleteMonthlyIncomeSourceOptions = {}
) {
  return apiClient.delete<MonthlyIncomeSourceDeleteResponse>(`/finance/monthly-income/sources/${sourceId}`, {
    signal: options.signal,
  })
}

export const monthlyIncomeService = {
  listMonthlyIncome,
  createMonthlyIncomeSource,
  updateMonthlyIncomeSource,
  deleteMonthlyIncomeSource,
}
