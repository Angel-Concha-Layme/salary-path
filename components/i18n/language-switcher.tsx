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
const SIDEBAR_TONE_ACTIVE_CLASS_NAME = "ui-theme-sidebar-toggle-active"
const SIDEBAR_COMPACT_ICON_CLASS_NAME =
  "h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent px-0 text-sidebar-foreground shadow-none transition-colors duration-200 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground focus-visible:bg-sidebar-accent/70 focus-visible:text-sidebar-foreground"

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
    const compactClassName =
      tone === "sidebar"
        ? SIDEBAR_COMPACT_ICON_CLASS_NAME
        : "size-9 px-0"

    return (
      <div className="mx-auto w-fit">
        <Button
          type="button"
          variant={tone === "sidebar" ? "ghost" : "outline"}
          onClick={() => changeLocale(nextLocale)}
          className={cn(compactClassName)}
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
