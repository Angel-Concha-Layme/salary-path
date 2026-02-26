"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type {
  MonthlyIncomeRangePreset,
  MonthlyIncomeSourceCreateInput,
  MonthlyIncomeSourceUpdateInput,
} from "@/app/lib/models/finance/monthly-income.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { queryKeys } from "@/app/lib/services/query-keys"
import { monthlyIncomeService } from "@/app/lib/services/finance/monthly-income.service"

const PERSONAL_DATA_STALE_TIME_MS = 1000 * 60 * 10
const PERSONAL_DATA_CACHE_TIME_MS = 1000 * 60 * 20

export interface UseMonthlyIncomeListParams {
  range?: MonthlyIncomeRangePreset
}

export function getMonthlyIncomeListQueryOptions(params: UseMonthlyIncomeListParams = {}) {
  const range = params.range ?? "all"

  return queryOptions({
    queryKey: queryKeys.finance.monthlyIncome.list({ range }),
    queryFn: ({ signal }) => monthlyIncomeService.listMonthlyIncome({ range, signal }),
    staleTime: PERSONAL_DATA_STALE_TIME_MS,
    cacheTime: PERSONAL_DATA_CACHE_TIME_MS,
  })
}

export function useMonthlyIncomeListQuery(params: UseMonthlyIncomeListParams = {}) {
  return useQuery(getMonthlyIncomeListQueryOptions(params))
}

export function useCreateMonthlyIncomeSourceMutation() {
  return useDomainMutation({
    domain: "finance",
    mutationFn: (input: MonthlyIncomeSourceCreateInput) => monthlyIncomeService.createMonthlyIncomeSource(input),
  })
}

export function useUpdateMonthlyIncomeSourceMutation() {
  return useDomainMutation({
    domain: "finance",
    mutationFn: ({ sourceId, input }: { sourceId: string; input: MonthlyIncomeSourceUpdateInput }) =>
      monthlyIncomeService.updateMonthlyIncomeSource(sourceId, input),
  })
}

export function useDeleteMonthlyIncomeSourceMutation() {
  return useDomainMutation({
    domain: "finance",
    mutationFn: (sourceId: string) => monthlyIncomeService.deleteMonthlyIncomeSource(sourceId),
  })
}
