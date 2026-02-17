import { describe, expect, it } from "vitest"

import {
  CompensationType,
  CurrencyCode,
  PathCompanyEventType,
  currencyCodeSchema,
  currencyOptions,
  getCompensationRateStep,
  normalizeCompensationType,
  normalizeCurrencyCode,
  normalizePathCompanyEventType,
} from "@/app/lib/models/common/domain-enums"

describe("domain enums", () => {
  it("uses uppercase mapping keys with stable wire values", () => {
    expect(CompensationType.HOURLY).toBe("hourly")
    expect(CompensationType.MONTHLY).toBe("monthly")
    expect(PathCompanyEventType.START_RATE).toBe("start_rate")
    expect(CurrencyCode.USD).toBe("USD")
  })

  it("normalizes compensation and event values with safe fallbacks", () => {
    expect(normalizeCompensationType(" HOURLY ")).toBe(CompensationType.HOURLY)
    expect(normalizeCompensationType("invalid")).toBe(CompensationType.MONTHLY)
    expect(normalizePathCompanyEventType("promotion")).toBe(PathCompanyEventType.PROMOTION)
    expect(normalizePathCompanyEventType("annual")).toBe(PathCompanyEventType.ANNUAL_INCREASE)
    expect(normalizePathCompanyEventType("unknown")).toBe(PathCompanyEventType.RATE_INCREASE)
  })

  it("normalizes currencies and validates ISO-4217 support", () => {
    expect(normalizeCurrencyCode(" usd ")).toBe(CurrencyCode.USD)
    expect(normalizeCurrencyCode("BAD")).toBe(CurrencyCode.USD)
    expect(currencyCodeSchema.safeParse("pen").success).toBe(true)
    expect(currencyCodeSchema.safeParse("BAD").success).toBe(false)
  })

  it("keeps legacy currency priority while exposing a broad ISO list", () => {
    expect(currencyOptions.slice(0, 5)).toEqual(["USD", "PEN", "EUR", "GBP", "MXN"])
    expect(currencyOptions.length).toBeGreaterThan(100)
  })

  it("returns override and fallback steps without breaking unknown inputs", () => {
    expect(getCompensationRateStep(CompensationType.MONTHLY, "COP")).toBe(100000)
    expect(getCompensationRateStep(CompensationType.HOURLY, "JPY")).toBe(1)
    expect(getCompensationRateStep(CompensationType.MONTHLY, "unknown")).toBe(100)
  })
})
