"use client"

import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface OnboardingWizardShellProps {
  children: ReactNode
  maxWidthClassName?: string
  containerClassName?: string
  cardClassName?: string
  outerPaddingClassName?: string
}

export function OnboardingWizardShell({
  children,
  maxWidthClassName,
  containerClassName,
  cardClassName,
  outerPaddingClassName,
}: OnboardingWizardShellProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full p-4 sm:p-6 md:p-8",
        maxWidthClassName,
        containerClassName,
        outerPaddingClassName
      )}
    >
      <div className={cn("w-full", cardClassName)}>
        {children}
      </div>
    </div>
  )
}
