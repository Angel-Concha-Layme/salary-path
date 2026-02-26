import { z } from "zod"

import { currencyCodeSchema } from "@/app/lib/models/common/domain-enums"

export const monthlyIncomeSourceTypeOptions = [
  "employment",
  "bonus",
  "extra_income",
  "adjustment",
] as const

export type MonthlyIncomeSourceType = (typeof monthlyIncomeSourceTypeOptions)[number]

export const monthlyIncomeSourceTypeSchema = z.enum(monthlyIncomeSourceTypeOptions)

export const monthlyIncomeRangePresetOptions = ["all", "ytd", "last12m", "last36m"] as const

export type MonthlyIncomeRangePreset = (typeof monthlyIncomeRangePresetOptions)[number]

export const monthlyIncomeRangePresetSchema = z.enum(monthlyIncomeRangePresetOptions)

export interface MonthlyIncomeSource {
  id: string
  month: string
  currency: string
  sourceType: MonthlyIncomeSourceType
  pathCompanyId: string | null
  companyName: string | null
  computedAmount: number
  finalAmount: number
  isUserEdited: boolean
  note: string | null
}

export interface MonthlyIncomeCurrencyBucket {
  month: string
  currency: string
  totals: {
    employmentComputed: number
    employmentFinal: number
    bonus: number
    extraIncome: number
    adjustment: number
    final: number
    isAdjusted: boolean
  }
  sources: MonthlyIncomeSource[]
}

export interface MonthlyIncomeListResponse {
  items: MonthlyIncomeCurrencyBucket[]
  total: number
}

export interface MonthlyIncomeSourceCreateInput {
  month: string
  currency: string
  sourceType: Exclude<MonthlyIncomeSourceType, "employment">
  amount: number
  note?: string | null
}

export interface MonthlyIncomeSourceUpdateInput {
  finalAmount?: number
  note?: string | null
  clearOverride?: boolean
}

export interface MonthlyIncomeSourceDeleteResponse {
  id: string
  deletedAt: string
}

export const monthlyIncomeSourceCreateSchema = z.object({
  month: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "month must use YYYY-MM format"),
  currency: currencyCodeSchema,
  sourceType: monthlyIncomeSourceTypeSchema.exclude(["employment"]),
  amount: z.number().finite(),
  note: z.string().trim().max(500).nullable().optional(),
})

export const monthlyIncomeSourceUpdateSchema = z
  .object({
    finalAmount: z.number().finite().optional(),
    note: z.string().trim().max(500).nullable().optional(),
    clearOverride: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.finalAmount !== undefined ||
      value.note !== undefined ||
      value.clearOverride !== undefined,
    {
      message: "At least one field must be provided",
    }
  )
