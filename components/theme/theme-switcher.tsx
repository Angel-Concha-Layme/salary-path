"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"

interface ThemeSwitcherProps {
  compact?: boolean
  small?: boolean
}

function subscribe() {
  return () => {}
}

export function ThemeSwitcher({
  compact = false,
  small = false,
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
    const isActive = activeTheme === "dark"
    const nextTheme = activeTheme === "dark" ? "light" : "dark"
    const label = nextTheme === "dark" ? dictionary.theme.dark : dictionary.theme.light

    return (
      <div className="mx-auto w-fit">
        <Button
          type="button"
          variant={isActive ? "default" : "outline"}
          className="size-9 justify-center px-0"
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
        variant={activeTheme === "light" ? "default" : "outline"}
        onClick={() => setTheme("light")}
        className={small ? "h-7 px-2" : undefined}
      >
        <SunIcon className={small ? "size-3.5" : "size-4"} />
        <span className={small ? "text-[11px]" : undefined}>{dictionary.theme.light}</span>
      </Button>
      <Button
        type="button"
        size={small ? "sm" : "default"}
        variant={activeTheme === "dark" ? "default" : "outline"}
        onClick={() => setTheme("dark")}
        className={small ? "h-7 px-2" : undefined}
      >
        <MoonIcon className={small ? "size-3.5" : "size-4"} />
        <span className={small ? "text-[11px]" : undefined}>{dictionary.theme.dark}</span>
      </Button>
    </div>
  )
}
