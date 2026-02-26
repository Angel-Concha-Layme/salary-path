import { z } from "zod"

import {
  CompensationType,
  PathCompanyEventType,
  compensationStepOverrides,
  compensationTypeOptions,
  currencyCodeSchema,
  currencyOptions,
  getCompensationRateStep,
  type CompensationTypeValue,
  type CurrencyCodeValue,
} from "@/app/lib/models/common/domain-enums"
import {
  buildDefaultWorkSchedule,
  workScheduleSchema,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"

export { currencyOptions, compensationTypeOptions, getCompensationRateStep }

export type CompensationTypeOption = CompensationTypeValue
export type CurrencyOption = CurrencyCodeValue

export const onboardingEventTypeOptions = [
  PathCompanyEventType.RATE_INCREASE,
  PathCompanyEventType.ANNUAL_INCREASE,
  PathCompanyEventType.MID_YEAR_INCREASE,
  PathCompanyEventType.PROMOTION,
] as const

export type OnboardingEventType = (typeof onboardingEventTypeOptions)[number]

interface CompensationStepConfig {
  hourly: number
  monthly: number
}

export const compensationStepByCurrency: Partial<Record<CurrencyOption, CompensationStepConfig>> =
  compensationStepOverrides

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `draft-${Math.random().toString(36).slice(2, 10)}`
}

export function toUtcDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function normalizeOnboardingCalendarDate(date: Date | null): Date | null {
  if (!date) {
    return null
  }

  return toUtcDateOnly(date)
}

export function serializeOnboardingCalendarDate(date: Date): string {
  const normalized = toUtcDateOnly(date)
  return new Date(
    Date.UTC(normalized.getFullYear(), normalized.getMonth(), normalized.getDate())
  ).toISOString()
}

function getLatestEventDateByType(
  events: OnboardingCompanyEventDraft[],
  eventType: OnboardingEventType
): Date | null {
  const matching = events
    .filter((event) => event.eventType === eventType && event.effectiveDate !== null)
    .map((event) => toUtcDateOnly(event.effectiveDate as Date))

  if (matching.length === 0) {
    return null
  }

  return matching.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest
  )
}

export function resolveDefaultEventDate(params: {
  eventType: OnboardingEventType
  startDate: Date
  existingEvents: OnboardingCompanyEventDraft[]
  fallbackDate?: Date
}): Date {
  const startDate = toUtcDateOnly(params.startDate)

  if (params.eventType === PathCompanyEventType.ANNUAL_INCREASE) {
    const latestAnnual = getLatestEventDateByType(params.existingEvents, PathCompanyEventType.ANNUAL_INCREASE)
    const baselineYear = startDate.getFullYear() + 1
    const latestYear = latestAnnual ? latestAnnual.getFullYear() + 1 : baselineYear
    const year = Math.max(baselineYear, latestYear)
    return new Date(year, 0, 1)
  }

  if (params.eventType === PathCompanyEventType.MID_YEAR_INCREASE) {
    const latestMidYear = getLatestEventDateByType(
      params.existingEvents,
      PathCompanyEventType.MID_YEAR_INCREASE
    )

    let candidateYear = startDate.getFullYear()
    let candidate = new Date(candidateYear, 6, 1)

    if (candidate.getTime() <= startDate.getTime()) {
      candidateYear += 1
      candidate = new Date(candidateYear, 6, 1)
    }

    if (latestMidYear) {
      const nextYearFromHistory = latestMidYear.getFullYear() + 1
      if (nextYearFromHistory > candidateYear) {
        candidateYear = nextYearFromHistory
        candidate = new Date(candidateYear, 6, 1)
      }
    }

    return candidate
  }

  return toUtcDateOnly(params.fallbackDate ?? new Date())
}

export function resolveDefaultPreviousCompanyEndDate(
  companyStartDate: Date | null,
  currentCompanyStartDate: Date | null
): Date | null {
  if (!companyStartDate || !currentCompanyStartDate) {
    return null
  }

  const normalizedCompanyStartDate = toUtcDateOnly(companyStartDate)
  const normalizedCurrentCompanyStartDate = toUtcDateOnly(currentCompanyStartDate)

  if (normalizedCompanyStartDate.getTime() >= normalizedCurrentCompanyStartDate.getTime()) {
    return null
  }

  return new Date(normalizedCurrentCompanyStartDate.getTime() - 24 * 60 * 60 * 1000)
}

export interface OnboardingCompanyEventDraft {
  id: string
  eventType: OnboardingEventType
  effectiveDate: Date | null
  amount: number
  notes: string
}

export interface OnboardingAdditionalCompanyDraft {
  id: string
  companyName: string
  roleName: string
  startDate: Date | null
  endDate: Date | null
  isCurrentJob: boolean
  isEndDateAuto: boolean
  compensationType: CompensationTypeValue
  currency: string
  startRate: number
  events: OnboardingCompanyEventDraft[]
  workSchedule: WorkSchedule
}

export interface BuildOnboardingCompanyEventDraftOptions {
  eventType?: OnboardingEventType
  startDate?: Date | null
  existingEvents?: OnboardingCompanyEventDraft[]
  fallbackDate?: Date
}

export function buildOnboardingCompanyEventDraft(
  options: BuildOnboardingCompanyEventDraftOptions = {}
): OnboardingCompanyEventDraft {
  const eventType = options.eventType ?? PathCompanyEventType.RATE_INCREASE
  const effectiveDate = options.startDate
    ? resolveDefaultEventDate({
      eventType,
      startDate: options.startDate,
      existingEvents: options.existingEvents ?? [],
      fallbackDate: options.fallbackDate,
    })
    : toUtcDateOnly(options.fallbackDate ?? new Date())

  return {
    id: createDraftId(),
    eventType,
    effectiveDate,
    amount: 0,
    notes: "",
  }
}

export function buildOnboardingAdditionalCompanyDraft(params: {
  currentCompanyStartDate: Date | null
  defaultWorkSchedule: WorkSchedule
  compensationType: CompensationTypeValue
  currency: string
  startDate?: Date | null
}): OnboardingAdditionalCompanyDraft {
  const startDate = params.startDate ?? null
  const endDate = resolveDefaultPreviousCompanyEndDate(startDate, params.currentCompanyStartDate)

  return {
    id: createDraftId(),
    companyName: "",
    roleName: "",
    startDate,
    endDate,
    isCurrentJob: endDate === null,
    isEndDateAuto: endDate !== null,
    compensationType: params.compensationType,
    currency: params.currency,
    startRate: 0,
    events: [],
    workSchedule: params.defaultWorkSchedule,
  }
}

const onboardingEventDraftSchema = z.object({
  id: z.string().trim().min(1),
  eventType: z.enum(onboardingEventTypeOptions),
  effectiveDate: z.date().nullable(),
  amount: z.number().min(0),
  notes: z.string().max(1000),
})

const onboardingAdditionalCompanyDraftSchema = z
  .object({
    id: z.string().trim().min(1),
    companyName: z.string().trim().min(1),
    roleName: z.string().trim().min(1),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
    isCurrentJob: z.boolean(),
    isEndDateAuto: z.boolean(),
    compensationType: z.enum(compensationTypeOptions),
    currency: currencyCodeSchema,
    startRate: z.number().gt(0),
    events: z.array(onboardingEventDraftSchema),
    workSchedule: workScheduleSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required",
        path: ["startDate"],
      })
      return
    }

    if (value.endDate && value.endDate.getTime() < value.startDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be greater than or equal to start date",
        path: ["endDate"],
      })
    }

    value.events.forEach((event, index) => {
      if (!event.effectiveDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event date is required",
          path: ["events", index, "effectiveDate"],
        })
        return
      }

      if (event.effectiveDate.getTime() < value.startDate!.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event date must be greater than or equal to start date",
          path: ["events", index, "effectiveDate"],
        })
      }

      if (value.endDate && event.effectiveDate.getTime() > value.endDate.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event date must be less than or equal to end date",
          path: ["events", index, "effectiveDate"],
        })
      }
    })
  })

const onboardingFormBaseSchema = z.object({
  companyName: z.string().trim().min(1),
  roleName: z.string().trim().min(1),
  startDate: z.date().nullable(),
  compensationType: z.enum(compensationTypeOptions),
  currency: currencyCodeSchema,
  startRate: z.number().gt(0),
  events: z.array(onboardingEventDraftSchema),
  defaultWorkSchedule: workScheduleSchema,
  additionalCompanies: z.array(onboardingAdditionalCompanyDraftSchema),
})

export const onboardingFormSchema = onboardingFormBaseSchema.superRefine((value, ctx) => {
  if (!value.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Start date is required",
      path: ["startDate"],
    })
    return
  }

  value.events.forEach((event, index) => {
    if (!event.effectiveDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Event date is required",
        path: ["events", index, "effectiveDate"],
      })
      return
    }

    if (event.effectiveDate.getTime() < value.startDate!.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Event date must be greater than or equal to start date",
        path: ["events", index, "effectiveDate"],
      })
    }
  })
})

export const onboardingStep1Schema = onboardingFormBaseSchema
  .pick({
    companyName: true,
    roleName: true,
    startDate: true,
  })
  .superRefine((value, ctx) => {
    if (!value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required",
        path: ["startDate"],
      })
    }
  })

export const onboardingStep2Schema = onboardingFormBaseSchema
  .pick({
    compensationType: true,
    currency: true,
    startRate: true,
    events: true,
    startDate: true,
  })
  .superRefine((value, ctx) => {
    if (!value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required",
        path: ["startDate"],
      })
      return
    }

    value.events.forEach((event, index) => {
      if (!event.effectiveDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event date is required",
          path: ["events", index, "effectiveDate"],
        })
        return
      }

      if (event.effectiveDate.getTime() < value.startDate!.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Event date must be greater than or equal to start date",
          path: ["events", index, "effectiveDate"],
        })
      }
    })
  })

export const onboardingStep3Schema = onboardingFormBaseSchema.pick({
  defaultWorkSchedule: true,
})

export const onboardingStep4Schema = onboardingFormBaseSchema.pick({
  additionalCompanies: true,
})

export const onboardingStepSchemas = [
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
] as const

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>

export const onboardingDefaultValues: OnboardingFormValues = {
  companyName: "",
  roleName: "",
  startDate: null,
  compensationType: CompensationType.MONTHLY,
  currency: "USD",
  startRate: 0,
  events: [],
  defaultWorkSchedule: buildDefaultWorkSchedule(),
  additionalCompanies: [],
}
