import { describe, expect, it } from "vitest"

import {
  onboardingStep4Schema,
  onboardingStep3Schema,
  onboardingStep2Schema,
  onboardingStep1Schema,
  onboardingFormSchema,
  onboardingDefaultValues,
  currencyOptions,
  compensationStepByCurrency,
  getCompensationRateStep,
  resolveDefaultEventDate,
  resolveDefaultPreviousCompanyEndDate,
  normalizeOnboardingCalendarDate,
  serializeOnboardingCalendarDate,
  buildOnboardingAdditionalCompanyDraft,
  buildOnboardingCompanyEventDraft,
} from "@/app/lib/models/onboarding/onboarding-form.model"
import { PathCompanyEventType } from "@/app/lib/models/common/domain-enums"
import { buildDefaultWorkSchedule } from "@/app/lib/models/work-schedule/work-schedule.model"

describe("onboarding form schema", () => {
  const legacyStepCurrencies = [
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

  it("provides expected defaults", () => {
    expect(onboardingDefaultValues.defaultWorkSchedule).toEqual(buildDefaultWorkSchedule())
    expect(onboardingDefaultValues.compensationType).toBe("monthly")
    expect(onboardingDefaultValues.startRate).toBe(0)
    expect(onboardingDefaultValues.events).toEqual([])
    expect(onboardingDefaultValues.additionalCompanies).toEqual([])
  })

  it("orders currencies with USD then PEN", () => {
    expect(currencyOptions.slice(0, 2)).toEqual(["USD", "PEN"])
  })

  it("uses larger monthly steps depending on currency", () => {
    expect(getCompensationRateStep("monthly", "USD")).toBe(100)
    expect(getCompensationRateStep("monthly", "PEN")).toBe(100)
    expect(getCompensationRateStep("monthly", "COP")).toBe(100000)
  })

  it("keeps the hourly step unchanged across currencies", () => {
    expect(getCompensationRateStep("hourly", "USD")).toBe(0.5)
    expect(getCompensationRateStep("hourly", "COP")).toBe(1000)
  })

  it("falls back to USD step for unknown currencies", () => {
    expect(getCompensationRateStep("monthly", "unknown")).toBe(100)
  })

  it("always uses smaller hourly steps than monthly steps", () => {
    for (const currency of legacyStepCurrencies) {
      const config = compensationStepByCurrency[currency]
      expect(config).toBeDefined()
      if (!config) {
        throw new Error("Missing compensation step config for legacy currency")
      }

      expect(config.hourly).toBeLessThan(config.monthly)
    }
  })

  it("derives fallback steps from ISO minor units", () => {
    expect(getCompensationRateStep("hourly", "JPY")).toBe(1)
    expect(getCompensationRateStep("monthly", "JPY")).toBe(100)
    expect(getCompensationRateStep("hourly", "BHD")).toBe(0.001)
    expect(getCompensationRateStep("monthly", "BHD")).toBe(0.1)
  })

  it("fails step 1 when company or role is missing", () => {
    const result = onboardingStep1Schema.safeParse({
      ...onboardingDefaultValues,
      companyName: "",
      roleName: "",
    })

    expect(result.success).toBe(false)
  })

  it("fails step 1 when start date is missing", () => {
    const result = onboardingStep1Schema.safeParse({
      ...onboardingDefaultValues,
      startDate: null,
    })

    expect(result.success).toBe(false)
  })

  it("accepts step 2 with valid compensation and events", () => {
    const result = onboardingStep2Schema.safeParse({
      ...onboardingDefaultValues,
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      compensationType: "hourly",
      currency: "USD",
      startRate: 10,
      events: [
        {
          ...buildOnboardingCompanyEventDraft({
            eventType: PathCompanyEventType.ANNUAL_INCREASE,
            startDate: new Date("2025-02-01T00:00:00.000Z"),
            existingEvents: [],
          }),
          amount: 12,
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it("fails step 2 when the starting compensation is zero", () => {
    const result = onboardingStep2Schema.safeParse({
      ...onboardingDefaultValues,
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      compensationType: "monthly",
      currency: "USD",
      startRate: 0,
      events: [],
    })

    expect(result.success).toBe(false)
  })

  it("fails step 2 when an event is before start date", () => {
    const result = onboardingStep2Schema.safeParse({
      ...onboardingDefaultValues,
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      events: [
        {
          ...buildOnboardingCompanyEventDraft({
            eventType: PathCompanyEventType.RATE_INCREASE,
            startDate: new Date("2025-02-01T00:00:00.000Z"),
            existingEvents: [],
          }),
          effectiveDate: new Date("2025-01-15T00:00:00.000Z"),
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it("accepts step 3 with valid work settings", () => {
    const result = onboardingStep3Schema.safeParse({
      ...onboardingDefaultValues,
      defaultWorkSchedule: buildDefaultWorkSchedule(),
    })

    expect(result.success).toBe(true)
  })

  it("accepts step 4 with valid additional company", () => {
    const draft = buildOnboardingAdditionalCompanyDraft({
      currentCompanyStartDate: new Date("2026-02-01T00:00:00.000Z"),
      defaultWorkSchedule: buildDefaultWorkSchedule(),
      compensationType: "monthly",
      currency: "USD",
      startDate: new Date("2025-01-01T00:00:00.000Z"),
    })

    const result = onboardingStep4Schema.safeParse({
      ...onboardingDefaultValues,
      additionalCompanies: [
        {
          ...draft,
          companyName: "Northbyte",
          roleName: "Engineer",
          startRate: 2500,
          events: [
            {
              ...buildOnboardingCompanyEventDraft({
                eventType: PathCompanyEventType.MID_YEAR_INCREASE,
                startDate: new Date("2025-01-01T00:00:00.000Z"),
                existingEvents: [],
              }),
              amount: 2800,
            },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it("fails step 4 when an additional company has zero starting compensation", () => {
    const draft = buildOnboardingAdditionalCompanyDraft({
      currentCompanyStartDate: new Date("2026-02-01T00:00:00.000Z"),
      defaultWorkSchedule: buildDefaultWorkSchedule(),
      compensationType: "monthly",
      currency: "USD",
      startDate: new Date("2025-01-01T00:00:00.000Z"),
    })

    const result = onboardingStep4Schema.safeParse({
      ...onboardingDefaultValues,
      additionalCompanies: [
        {
          ...draft,
          companyName: "Northbyte",
          roleName: "Engineer",
          startRate: 0,
          events: [],
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  it("validates full schema with current company and events", () => {
    const result = onboardingFormSchema.safeParse({
      ...onboardingDefaultValues,
      companyName: "Acme",
      roleName: "Frontend Developer",
      startDate: new Date("2025-02-01T00:00:00.000Z"),
      startRate: 3000,
      events: [
        {
          ...buildOnboardingCompanyEventDraft({
            eventType: PathCompanyEventType.ANNUAL_INCREASE,
            startDate: new Date("2025-02-01T00:00:00.000Z"),
            existingEvents: [],
          }),
          amount: 3300,
        },
      ],
    })

    expect(result.success).toBe(true)
  })
})

describe("onboarding date helpers", () => {
  function toDateOnlyKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  it("calculates annual and mid-year defaults using calendar cycles", () => {
    const startDate = new Date(2025, 1, 10, 18, 30, 0)

    const annualDate = resolveDefaultEventDate({
      eventType: PathCompanyEventType.ANNUAL_INCREASE,
      startDate,
      existingEvents: [],
    })
    const midYearDate = resolveDefaultEventDate({
      eventType: PathCompanyEventType.MID_YEAR_INCREASE,
      startDate,
      existingEvents: [],
    })

    expect(toDateOnlyKey(annualDate)).toBe("2026-01-01")
    expect(toDateOnlyKey(midYearDate)).toBe("2025-07-01")
  })

  it("moves mid-year defaults to the next year when start date is already on July 1", () => {
    const startDate = new Date(2025, 6, 1)

    const midYearDate = resolveDefaultEventDate({
      eventType: PathCompanyEventType.MID_YEAR_INCREASE,
      startDate,
      existingEvents: [],
    })

    expect(toDateOnlyKey(midYearDate)).toBe("2026-07-01")
  })

  it("advances annual and mid-year cycles when events already exist", () => {
    const startDate = new Date(2025, 1, 10)
    const annualExisting = [
      {
        ...buildOnboardingCompanyEventDraft({
          eventType: PathCompanyEventType.ANNUAL_INCREASE,
          startDate,
          existingEvents: [],
        }),
        effectiveDate: new Date(2026, 0, 1),
      },
    ]
    const midYearExisting = [
      {
        ...buildOnboardingCompanyEventDraft({
          eventType: PathCompanyEventType.MID_YEAR_INCREASE,
          startDate,
          existingEvents: [],
        }),
        effectiveDate: new Date(2025, 6, 1),
      },
    ]

    const nextAnnualDate = resolveDefaultEventDate({
      eventType: PathCompanyEventType.ANNUAL_INCREASE,
      startDate,
      existingEvents: annualExisting,
    })
    const nextMidYearDate = resolveDefaultEventDate({
      eventType: PathCompanyEventType.MID_YEAR_INCREASE,
      startDate,
      existingEvents: midYearExisting,
    })

    expect(toDateOnlyKey(nextAnnualDate)).toBe("2027-01-01")
    expect(toDateOnlyKey(nextMidYearDate)).toBe("2026-07-01")
  })

  it("normalizes and serializes calendar dates without timezone drift", () => {
    const selectedDate = new Date(2025, 1, 20, 21, 45, 30)

    const normalized = normalizeOnboardingCalendarDate(selectedDate)
    const serialized = serializeOnboardingCalendarDate(selectedDate)

    expect(normalized).not.toBeNull()
    expect(normalized?.getHours()).toBe(0)
    expect(normalized?.getMinutes()).toBe(0)
    expect(toDateOnlyKey(normalized as Date)).toBe("2025-02-20")
    expect(serialized).toBe("2025-02-20T00:00:00.000Z")
  })

  it("defaults previous company close date to the day before current company start", () => {
    const previousStartDate = new Date(2024, 2, 10)
    const currentStartDate = new Date(2025, 1, 1)

    const closeDate = resolveDefaultPreviousCompanyEndDate(previousStartDate, currentStartDate)

    expect(closeDate).not.toBeNull()
    expect(toDateOnlyKey(closeDate as Date)).toBe("2025-01-31")
  })

  it("returns null close date for overlapping or later company starts", () => {
    const currentStartDate = new Date(2025, 1, 1)

    expect(
      resolveDefaultPreviousCompanyEndDate(new Date(2025, 1, 1), currentStartDate)
    ).toBeNull()
    expect(
      resolveDefaultPreviousCompanyEndDate(new Date(2026, 0, 1), currentStartDate)
    ).toBeNull()
  })
})
