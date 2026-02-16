import { getCookieCache, getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

import { hasAdminRole } from "@/app/lib/auth/roles"
import {
  getLocaleCookieName,
  isLocale,
  resolveLocaleFromRequest,
  type AppLocale,
} from "@/app/lib/i18n/locales"
import {
  isAdminSegment,
  isProtectedSegment,
} from "@/app/lib/navigation/route-config"

function buildRedirect(request: NextRequest, pathname: string): NextResponse {
  const url = new URL(pathname, request.url)
  return NextResponse.redirect(url)
}

function withLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  locale: AppLocale
): NextResponse {
  const currentLocale = request.cookies.get(getLocaleCookieName())?.value

  if (currentLocale === locale) {
    return response
  }

  response.cookies.set(getLocaleCookieName(), locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}

function isBypassedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  )
}

function getLegacyLocalizedPath(pathname: string): {
  locale: AppLocale
  pathname: string
} | null {
  const segments = pathname.split("/").filter(Boolean)
  const firstSegment = segments[0]

  if (!firstSegment || !isLocale(firstSegment)) {
    return null
  }

  const nextPathname = segments.length > 1 ? `/${segments.slice(1).join("/")}` : "/"

  return {
    locale: firstSegment,
    pathname: nextPathname,
  }
}

async function getIsAdminFromCookie(request: NextRequest): Promise<boolean> {
  if (!process.env.BETTER_AUTH_SECRET) {
    return false
  }

  const cookieCache = (await getCookieCache(request, {
    secret: process.env.BETTER_AUTH_SECRET,
    cookiePrefix: "better-auth",
  })) as { user?: { role?: string } } | null

  return hasAdminRole(cookieCache?.user?.role)
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isBypassedPath(pathname)) {
    return NextResponse.next()
  }

  const legacyLocalizedPath = getLegacyLocalizedPath(pathname)

  if (legacyLocalizedPath) {
    return withLocaleCookie(
      request,
      buildRedirect(request, `${legacyLocalizedPath.pathname}${search}`),
      legacyLocalizedPath.locale
    )
  }

  const locale = resolveLocaleFromRequest(request)
  const hasSession = Boolean(getSessionCookie(request))

  if (pathname === "/") {
    return withLocaleCookie(
      request,
      buildRedirect(request, hasSession ? "/personal-path" : "/sign-in"),
      locale
    )
  }

  const callbackUrl = encodeURIComponent(`${pathname}${search}`)

  if (pathname === "/sign-in" && hasSession) {
    return withLocaleCookie(
      request,
      buildRedirect(request, "/personal-path"),
      locale
    )
  }

  if (isProtectedSegment(pathname) && !hasSession) {
    return withLocaleCookie(
      request,
      buildRedirect(request, `/sign-in?callbackUrl=${callbackUrl}`),
      locale
    )
  }

  if (isAdminSegment(pathname)) {
    if (!hasSession) {
      return withLocaleCookie(
        request,
        buildRedirect(request, `/sign-in?callbackUrl=${callbackUrl}`),
        locale
      )
    }

    const isAdmin = await getIsAdminFromCookie(request)

    if (!isAdmin) {
      return withLocaleCookie(
        request,
        buildRedirect(request, "/403"),
        locale
      )
    }
  }

  return withLocaleCookie(request, NextResponse.next(), locale)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
