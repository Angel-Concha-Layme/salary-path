import Link from "next/link"

import { getDictionary } from "@/app/lib/i18n/get-dictionary"
import { getRequestLocale } from "@/app/lib/i18n/get-request-locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ForbiddenPage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg rounded-2xl">
        <CardHeader>
          <CardTitle>{dictionary.errors.forbiddenTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{dictionary.errors.forbiddenBody}</p>
          <Button asChild>
            <Link href="/personal-path">{dictionary.errors.goHome}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
