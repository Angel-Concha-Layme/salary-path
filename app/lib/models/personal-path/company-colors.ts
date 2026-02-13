const COMPANY_COLOR_REGEX = /^#[0-9A-F]{6}$/

export const companyColorPalette = [
  "#0F766E",
  "#0369A1",
  "#1D4ED8",
  "#166534",
  "#B45309",
  "#C2410C",
  "#BE123C",
  "#475569",
] as const

export type CompanyPaletteColor = (typeof companyColorPalette)[number]

export function normalizeCompanyColor(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim().toUpperCase()

  if (!trimmed.startsWith("#")) {
    return null
  }

  return trimmed
}

export function isValidCompanyColor(value: string | null | undefined): value is string {
  const normalized = normalizeCompanyColor(value)

  if (!normalized) {
    return false
  }

  return COMPANY_COLOR_REGEX.test(normalized)
}

export function getRandomCompanyColor(random = Math.random): CompanyPaletteColor {
  const index = Math.floor(random() * companyColorPalette.length)
  return companyColorPalette[index] ?? companyColorPalette[0]
}

export function coerceCompanyColor(
  value: string | null | undefined,
  fallback: CompanyPaletteColor = companyColorPalette[0]
): string {
  const normalized = normalizeCompanyColor(value)

  if (!normalized) {
    return fallback
  }

  return isValidCompanyColor(normalized) ? normalized : fallback
}

export { COMPANY_COLOR_REGEX }
