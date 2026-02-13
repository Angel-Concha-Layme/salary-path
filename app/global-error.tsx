"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"

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
          <Button asChild>
            <Link href="/">{dictionary.errors.goHome}</Link>
          </Button>
        </div>
      </body>
    </html>
  )
}
