"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"

const ERROR_ACTION_BUTTON_CLASS_NAME =
  "bg-[var(--ui-controls-primary-light,var(--ui-legacy-primary-light,oklch(0.145_0_0)))] dark:bg-[var(--ui-controls-primary-dark,var(--ui-legacy-primary-dark,oklch(0.985_0_0)))] text-primary-foreground hover:opacity-90"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { dictionary } = useDictionary()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold">{dictionary.errors.pageTitle}</h2>
        <p className="text-muted-foreground">{dictionary.errors.pageBody}</p>
        <Button onClick={reset} className={ERROR_ACTION_BUTTON_CLASS_NAME}>
          {dictionary.errors.retry}
        </Button>
      </div>
    </div>
  )
}
