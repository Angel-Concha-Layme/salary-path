import { describe, expect, it } from "vitest"

import {
  onboardingStep3Schema,
  onboardingStep2Schema,
  onboardingStep1Schema,
  onboardingFormSchema,
  onboardingDefaultValues,
  currencyOptions,
  compensationStepByCurrency,
  getCompensationRateStep,
} from "@/app/lib/models/onboarding/onboarding-form.model"
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

  it("accepts step 2 with valid compensation data", () => {
    const result = onboardingStep2Schema.safeParse({
      ...onboardingDefaultValues,
      compensationType: "hourly",
      currency: "USD",
      initialRate: 10,
      currentRate: 12,
    })

    expect(result.success).toBe(true)
  })

  it("accepts step 3 with valid work settings", () => {
    const result = onboardingStep3Schema.safeParse({
      ...onboardingDefaultValues,
      defaultWorkSchedule: buildDefaultWorkSchedule(),
    })

    expect(result.success).toBe(true)
  })

  it("validates full schema with start date", () => {
    const result = onboardingFormSchema.safeParse({
      ...onboardingDefaultValues,
      companyName: "Acme",
      roleName: "Frontend Developer",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      initialRate: 30,
      currentRate: 35,
    })

    expect(result.success).toBe(true)
  })
})
