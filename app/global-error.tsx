"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"

const ERROR_ACTION_BUTTON_CLASS_NAME =
  "bg-[var(--ui-controls-primary-light,var(--ui-legacy-primary-light,oklch(0.145_0_0)))] dark:bg-[var(--ui-controls-primary-dark,var(--ui-legacy-primary-dark,oklch(0.985_0_0)))] text-primary-foreground hover:opacity-90"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  const { dictionary, locale } = useDictionary()

  return (
    <html lang={locale}>
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold">{dictionary.errors.globalTitle}</h2>
          <p className="text-muted-foreground">{error.message || dictionary.errors.globalBody}</p>
          <Button asChild className={ERROR_ACTION_BUTTON_CLASS_NAME}>
            <Link href="/">{dictionary.errors.goHome}</Link>
          </Button>
        </div>
      </body>
    </html>
  )
}
