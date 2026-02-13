import { NextResponse } from "next/server"

import { getLocaleCookieName, isLocale } from "@/app/lib/i18n/locales"

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { locale?: string }
    const locale = payload.locale

    if (!locale || !isLocale(locale)) {
      return NextResponse.json(
        { code: "INVALID_LOCALE", message: "Unsupported locale" },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ ok: true, locale })
    response.cookies.set(getLocaleCookieName(), locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
      sameSite: "lax",
    })

    return response
  } catch {
    return NextResponse.json(
      { code: "INVALID_PAYLOAD", message: "Invalid request body" },
      { status: 400 }
    )
  }
}
