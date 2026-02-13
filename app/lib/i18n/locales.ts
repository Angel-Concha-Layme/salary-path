import type { NextRequest } from "next/server"

export const SUPPORTED_LOCALES = ["es", "en"] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = "es"

const LOCALE_COOKIE_NAME = "salary-path.locale"

export function isLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale)
}

export function getLocaleCookieName(): string {
  return LOCALE_COOKIE_NAME
}

export function getPreferredLocaleFromHeader(headerValue: string | null): AppLocale {
  if (!headerValue) {
    return DEFAULT_LOCALE
  }

  const parsedLocales = headerValue
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "")
    .filter(Boolean)

  for (const locale of parsedLocales) {
    const baseLocale = locale.split("-")[0]

    if (baseLocale && isLocale(baseLocale)) {
      return baseLocale
    }
  }

  return DEFAULT_LOCALE
}

export function resolveLocaleFromRequest(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale
  }

  return getPreferredLocaleFromHeader(request.headers.get("accept-language"))
}
