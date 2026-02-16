import { z } from "zod"

export const currencyOptions = [
  "USD",
  "PEN",
  "EUR",
  "GBP",
  "MXN",
  "COP",
  "CLP",
  "ARS",
  "BRL",
  "CAD",
] as const

export const compensationTypeOptions = ["hourly", "monthly"] as const
export type CompensationTypeOption = (typeof compensationTypeOptions)[number]
export type CurrencyOption = (typeof currencyOptions)[number]

interface CompensationStepConfig {
  hourly: number
  monthly: number
}

export const compensationStepByCurrency: Record<CurrencyOption, CompensationStepConfig> = {
  USD: { hourly: 0.5, monthly: 100 },
  PEN: { hourly: 0.5, monthly: 100 },
  EUR: { hourly: 0.5, monthly: 100 },
  GBP: { hourly: 0.5, monthly: 100 },
  MXN: { hourly: 5, monthly: 500 },
  COP: { hourly: 1000, monthly: 100000 },
  CLP: { hourly: 500, monthly: 50000 },
  ARS: { hourly: 1000, monthly: 100000 },
  BRL: { hourly: 1, monthly: 100 },
  CAD: { hourly: 0.5, monthly: 100 },
}

export function getCompensationRateStep(
  compensationType: CompensationTypeOption,
  currency: string
): number {
  const normalizedCurrency = currency.trim().toUpperCase()
  const config = compensationStepByCurrency[normalizedCurrency as CurrencyOption] ?? compensationStepByCurrency.USD
  return config[compensationType]
}

const onboardingFormBaseSchema = z.object({
  companyName: z.string().trim().min(1),
  roleName: z.string().trim().min(1),
  startDate: z.date().nullable(),
  compensationType: z.enum(compensationTypeOptions),
  currency: z.string().trim().min(1).max(10),
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
  compensationType: "monthly",
  currency: "USD",
  initialRate: 0,
  currentRate: 0,
  monthlyWorkHours: 174,
  workDaysPerYear: 261,
}
