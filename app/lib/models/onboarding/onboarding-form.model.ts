import { z } from "zod"

import {
  CompensationType,
  compensationStepOverrides,
  compensationTypeOptions,
  currencyCodeSchema,
  currencyOptions,
  getCompensationRateStep,
  type CompensationTypeValue,
  type CurrencyCodeValue,
} from "@/app/lib/models/common/domain-enums"

export { currencyOptions, compensationTypeOptions, getCompensationRateStep }

export type CompensationTypeOption = CompensationTypeValue
export type CurrencyOption = CurrencyCodeValue

interface CompensationStepConfig {
  hourly: number
  monthly: number
}

export const compensationStepByCurrency: Partial<Record<CurrencyOption, CompensationStepConfig>> =
  compensationStepOverrides

const onboardingFormBaseSchema = z.object({
  companyName: z.string().trim().min(1),
  roleName: z.string().trim().min(1),
  startDate: z.date().nullable(),
  compensationType: z.enum(compensationTypeOptions),
  currency: currencyCodeSchema,
  initialRate: z.number().min(0),
  currentRate: z.number().min(0),
  monthlyWorkHours: z.number().int().positive().max(744),
  workDaysPerYear: z.number().int().min(1).max(366),
})

export const onboardingFormSchema = onboardingFormBaseSchema
  .refine((value) => value.startDate !== null, {
    message: "Start date is required",
    path: ["startDate"],
  })

export const onboardingStep1Schema = onboardingFormBaseSchema.pick({
  companyName: true,
  roleName: true,
  startDate: true,
})
  .refine((value) => value.startDate !== null, {
    message: "Start date is required",
    path: ["startDate"],
  })

export const onboardingStep2Schema = onboardingFormBaseSchema.pick({
  compensationType: true,
  currency: true,
  initialRate: true,
  currentRate: true,
})

export const onboardingStep3Schema = onboardingFormBaseSchema.pick({
  monthlyWorkHours: true,
  workDaysPerYear: true,
})

export const onboardingStepSchemas = [
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
] as const

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>

export const onboardingDefaultValues: OnboardingFormValues = {
  companyName: "",
  roleName: "",
  startDate: null,
  compensationType: CompensationType.MONTHLY,
  currency: "USD",
  initialRate: 0,
  currentRate: 0,
  monthlyWorkHours: 174,
  workDaysPerYear: 261,
}
