import { describe, expect, it } from "vitest"

import {
  COMPANY_COLOR_REGEX,
  coerceCompanyColor,
  companyColorPalette,
  getRandomCompanyColor,
  isValidCompanyColor,
  normalizeCompanyColor,
} from "@/app/lib/models/personal-path/company-colors"

describe("company colors", () => {
  it("contains only valid hex colors in palette", () => {
    companyColorPalette.forEach((color) => {
      expect(COMPANY_COLOR_REGEX.test(color)).toBe(true)
    })
  })

  it("normalizes color values to uppercase", () => {
    expect(normalizeCompanyColor("  #0f766e ")).toBe("#0F766E")
  })

  it("validates only 6 digit hex values", () => {
    expect(isValidCompanyColor("#0F766E")).toBe(true)
    expect(isValidCompanyColor("#0F76")).toBe(false)
    expect(isValidCompanyColor("0F766E")).toBe(false)
  })

  it("returns deterministic random palette color", () => {
    expect(getRandomCompanyColor(() => 0)).toBe(companyColorPalette[0])
    expect(getRandomCompanyColor(() => 0.9999)).toBe(
      companyColorPalette[companyColorPalette.length - 1]
    )
  })

  it("coerces invalid colors to fallback", () => {
    expect(coerceCompanyColor("#0369a1")).toBe("#0369A1")
    expect(coerceCompanyColor("invalid")).toBe(companyColorPalette[0])
  })
})
