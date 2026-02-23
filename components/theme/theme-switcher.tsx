"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { cn } from "@/lib/utils"

interface ThemeSwitcherProps {
  compact?: boolean
  small?: boolean
  tone?: "default" | "sidebar"
}

const SIDEBAR_TONE_INACTIVE_CLASS_NAME =
  "border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
const SIDEBAR_TONE_ACTIVE_CLASS_NAME =
  "border-sidebar-primary/45 bg-sidebar-primary/12 text-sidebar-foreground ring-1 ring-sidebar-primary/35 shadow-sm shadow-sidebar-primary/20 hover:bg-sidebar-primary/18"

function subscribe() {
  return () => {}
}

export function ThemeSwitcher({
  compact = false,
  small = false,
  tone = "default",
}: ThemeSwitcherProps) {
  const { dictionary } = useDictionary()
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const activeTheme = isClient ? resolvedTheme : undefined

  if (compact) {
    const isDarkTheme = activeTheme === "dark"
    const nextTheme = activeTheme === "dark" ? "light" : "dark"
    const label = nextTheme === "dark" ? dictionary.theme.dark : dictionary.theme.light
    const sidebarToneClassName =
      tone === "sidebar"
        ? SIDEBAR_TONE_ACTIVE_CLASS_NAME
        : undefined

    return (
      <div className="mx-auto w-fit">
        <Button
          type="button"
          variant={tone === "sidebar" ? "outline" : isDarkTheme ? "default" : "outline"}
          className={cn("size-9 justify-center px-0", sidebarToneClassName)}
          onClick={() => setTheme(nextTheme)}
          aria-label={label}
          title={label}
        >
          {activeTheme === "dark" ? <MoonIcon className="size-3.5" /> : <SunIcon className="size-3.5" />}
        </Button>
      </div>
    )
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2">
      <Button
        type="button"
        size={small ? "sm" : "default"}
        variant={
          tone === "sidebar"
            ? "outline"
            : activeTheme === "light"
              ? "default"
              : "outline"
        }
        onClick={() => setTheme("light")}
        className={cn(
          small && "h-7 px-2",
          tone === "sidebar" &&
            (activeTheme === "light"
              ? SIDEBAR_TONE_ACTIVE_CLASS_NAME
              : SIDEBAR_TONE_INACTIVE_CLASS_NAME)
        )}
        aria-pressed={activeTheme === "light"}
      >
        <SunIcon className={small ? "size-3.5" : "size-4"} />
        <span className={small ? "text-[11px]" : undefined}>{dictionary.theme.light}</span>
      </Button>
      <Button
        type="button"
        size={small ? "sm" : "default"}
        variant={
          tone === "sidebar"
            ? "outline"
            : activeTheme === "dark"
              ? "default"
              : "outline"
        }
        onClick={() => setTheme("dark")}
        className={cn(
          small && "h-7 px-2",
          tone === "sidebar" &&
            (activeTheme === "dark"
              ? SIDEBAR_TONE_ACTIVE_CLASS_NAME
              : SIDEBAR_TONE_INACTIVE_CLASS_NAME)
        )}
        aria-pressed={activeTheme === "dark"}
      >
        <MoonIcon className={small ? "size-3.5" : "size-4"} />
        <span className={small ? "text-[11px]" : undefined}>{dictionary.theme.dark}</span>
      </Button>
    </div>
  )
}
