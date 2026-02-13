"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

import {
  getSafeInternalTarget,
  OAUTH_POPUP_COMPLETE_MESSAGE,
} from "@/app/lib/auth/oauth-popup"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"

export default function OAuthPopupCompletePage() {
  const searchParams = useSearchParams()
  const { dictionary } = useDictionary()

  useEffect(() => {
    const target = getSafeInternalTarget(searchParams.get("target"))

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: OAUTH_POPUP_COMPLETE_MESSAGE,
          target,
        },
        window.location.origin
      )

      window.close()
      return
    }

    window.location.replace(target)
  }, [searchParams])

  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">{dictionary.common.loading}</p>
    </section>
  )
}
