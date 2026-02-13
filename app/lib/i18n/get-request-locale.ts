import { cookies, headers } from "next/headers"

import {
  DEFAULT_LOCALE,
  getLocaleCookieName,
  getPreferredLocaleFromHeader,
  isLocale,
  type AppLocale,
} from "@/app/lib/i18n/locales"

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(getLocaleCookieName())?.value

  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale
  }

  const acceptedLocale = getPreferredLocaleFromHeader(
    (await headers()).get("accept-language")
  )

  return acceptedLocale ?? DEFAULT_LOCALE
}
