"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

function useAccentColor() {
  const { resolvedTheme } = useTheme()
  const [accentColor, setAccentColor] = useState<string | null>(null)

  useEffect(() => {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--ui-accent-current")
      .trim()
    setAccentColor(color || null)
  }, [resolvedTheme])

  return accentColor
}

function Toaster({ className, ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()
  const accentColor = useAccentColor()

  const sonnerStyle = accentColor
    ? ({
        "--normal-bg": "var(--background)",
        "--normal-border": `color-mix(in oklch, ${accentColor} 35%, transparent)`,
        "--normal-text": "var(--foreground)",
      } as React.CSSProperties)
    : ({
        "--normal-bg": "var(--background)",
        "--normal-border": "var(--border)",
        "--normal-text": "var(--foreground)",
      } as React.CSSProperties)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group", className)}
      style={sonnerStyle}
      toastOptions={{
        classNames: {
          toast: "group toast rounded-xl group-[.toaster]:shadow-lg",
          title: "group-[.toast]:!text-foreground",
          description: "group-[.toast]:!text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border group-[.toast]:bg-background group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
