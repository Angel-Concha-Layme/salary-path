"use client"

import { useState } from "react"

import { getLocaleCookieName, type AppLocale } from "@/app/lib/i18n/locales"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  compact?: boolean
  small?: boolean
  tone?: "default" | "sidebar"
}

const SIDEBAR_TONE_INACTIVE_CLASS_NAME =
  "border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
const SIDEBAR_TONE_ACTIVE_CLASS_NAME =
  "border-sidebar-primary/45 bg-sidebar-primary/12 text-sidebar-foreground ring-1 ring-sidebar-primary/35 shadow-sm shadow-sidebar-primary/20 hover:bg-sidebar-primary/18"

const LOCALES: AppLocale[] = ["es", "en"]
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

function setLocaleCookie(nextLocale: AppLocale) {
  document.cookie = `${encodeURIComponent(getLocaleCookieName())}=${encodeURIComponent(nextLocale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

export function LanguageSwitcher({
  compact = false,
  small = false,
  tone = "default",
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
    const sidebarToneClassName =
      tone === "sidebar"
        ? SIDEBAR_TONE_ACTIVE_CLASS_NAME
        : ""

    return (
      <div className="mx-auto w-fit">
        <Button
          type="button"
          variant="outline"
          onClick={() => changeLocale(nextLocale)}
          className={cn("size-9 px-0", sidebarToneClassName)}
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
      {LOCALES.map((item) => {
        const isActive = locale === item
        const sidebarToneClassName =
          tone === "sidebar"
            ? isActive
              ? SIDEBAR_TONE_ACTIVE_CLASS_NAME
              : SIDEBAR_TONE_INACTIVE_CLASS_NAME
            : undefined

        return (
          <Button
            key={item}
            type="button"
            size={small ? "sm" : "default"}
            variant={
              tone === "sidebar" ? "outline" : isActive ? "default" : "outline"
            }
            onClick={() => changeLocale(item)}
            className={cn(small && "h-7 px-2", sidebarToneClassName)}
            disabled={isChanging}
            aria-pressed={isActive}
          >
            <span
              className={
                small
                  ? "text-[11px] font-semibold uppercase"
                  : "font-semibold uppercase"
              }
            >
              {item}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
