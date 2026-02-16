"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ className, ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()
  const sonnerStyle = {
    "--normal-bg": "oklch(0.97 0.03 184)",
    "--normal-border": "oklch(0.89 0.04 184)",
    "--normal-text": "oklch(0.33 0.08 185)",
  } as React.CSSProperties

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group", className)}
      style={sonnerStyle}
      toastOptions={{
        classNames: {
          toast: "group toast rounded-xl group-[.toaster]:shadow-lg",
          title: "group-[.toast]:!text-emerald-950",
          description: "group-[.toast]:!text-emerald-800",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-emerald-200 group-[.toast]:text-emerald-950",
          closeButton:
            "group-[.toast]:border-emerald-900/20 group-[.toast]:bg-emerald-100 group-[.toast]:text-emerald-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
