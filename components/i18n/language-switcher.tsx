"use client"

import { useState } from "react"

import { getLocaleCookieName, type AppLocale } from "@/app/lib/i18n/locales"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { Button } from "@/components/ui/button"

interface LanguageSwitcherProps {
  compact?: boolean
  small?: boolean
}

const LOCALES: AppLocale[] = ["es", "en"]
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

function setLocaleCookie(nextLocale: AppLocale) {
  document.cookie = `${encodeURIComponent(getLocaleCookieName())}=${encodeURIComponent(nextLocale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

export function LanguageSwitcher({
  compact = false,
  small = false,
}: LanguageSwitcherProps) {
  const { locale, dictionary, setLocale } = useDictionary()
  const [isChanging, setIsChanging] = useState(false)

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale || isChanging) {
      return
    }

    setIsChanging(true)
    setLocaleCookie(nextLocale)
    setLocale(nextLocale)
    
    setTimeout(() => setIsChanging(false), 300)
  }

  if (compact) {
    const nextLocale: AppLocale = locale === "es" ? "en" : "es"
    const compactLabel = `${dictionary.navigation.language}: ${locale.toUpperCase()}`

    return (
      <div className="mx-auto w-fit">
        <Button
          type="button"
          variant="outline"
          onClick={() => changeLocale(nextLocale)}
          className="size-9 px-0"
          disabled={isChanging}
          aria-label={compactLabel}
          title={compactLabel}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide">
            {locale}
          </span>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {LOCALES.map((item) => (
        <Button
          key={item}
          type="button"
          size={small ? "sm" : "default"}
          variant={locale === item ? "default" : "outline"}
          onClick={() => changeLocale(item)}
          className={small ? "h-7 px-2" : undefined}
          disabled={isChanging}
        >
          <span className={small ? "text-[11px] font-semibold uppercase" : "font-semibold uppercase"}>
            {item}
          </span>
        </Button>
      ))}
    </div>
  )
}
