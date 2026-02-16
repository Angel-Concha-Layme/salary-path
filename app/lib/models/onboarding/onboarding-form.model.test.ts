import { describe, expect, it } from "vitest"

import {
  getCompensationRateStep,
  compensationStepByCurrency,
  currencyOptions,
  onboardingDefaultValues,
  onboardingFormSchema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
} from "@/app/lib/models/onboarding/onboarding-form.model"

describe("onboarding form schema", () => {
  it("provides expected defaults", () => {
    expect(onboardingDefaultValues.monthlyWorkHours).toBe(174)
    expect(onboardingDefaultValues.workDaysPerYear).toBe(261)
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
    for (const currency of currencyOptions) {
      const config = compensationStepByCurrency[currency]
      expect(config.hourly).toBeLessThan(config.monthly)
    }
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
      monthlyWorkHours: 160,
      workDaysPerYear: 240,
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
