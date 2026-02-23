"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useBreakpointData } from "@/app/hooks/use-breakpoint-data"
import { authClient } from "@/app/lib/auth/client"
import {
  getSafeInternalTarget,
  isOAuthPopupCompleteMessage,
} from "@/app/lib/auth/oauth-popup"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { SignInAuthPanel } from "@/app/(auth)/sign-in/_components/sign-in-auth-panel"
import { SignInDesktopLayout } from "@/app/(auth)/sign-in/_components/sign-in-desktop-layout"
import { SignInHeroPanel } from "@/app/(auth)/sign-in/_components/sign-in-hero-panel"
import { SignInMobileLayout } from "@/app/(auth)/sign-in/_components/sign-in-mobile-layout"

interface SignInScreenProps {
  callbackUrl?: string
}

type SocialProvider = "github" | "google"

export function SignInScreen({ callbackUrl }: SignInScreenProps) {
  const { dictionary, locale } = useDictionary()
  const breakpoint = useBreakpointData()
  const router = useRouter()
  const popupWindowRef = useRef<Window | null>(null)
  const popupClosedWatcherRef = useRef<number | null>(null)
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null)

  const isSocialSignInPending = pendingProvider !== null
  const isGithubPending = pendingProvider === "github"
  const isGooglePending = pendingProvider === "google"
  const safeTarget = getSafeInternalTarget(callbackUrl)

  useEffect(() => {
    function clearPopupWatcher() {
      if (popupClosedWatcherRef.current !== null) {
        window.clearInterval(popupClosedWatcherRef.current)
        popupClosedWatcherRef.current = null
      }
    }

    function closePopupWindow() {
      if (popupWindowRef.current && !popupWindowRef.current.closed) {
        popupWindowRef.current.close()
      }
      popupWindowRef.current = null
    }

    function handlePopupMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return
      }

      if (!isOAuthPopupCompleteMessage(event.data)) {
        return
      }

      if (popupWindowRef.current && event.source !== popupWindowRef.current) {
        return
      }

      clearPopupWatcher()
      closePopupWindow()
      setPendingProvider(null)
      router.push(getSafeInternalTarget(event.data.target, safeTarget))
      router.refresh()
    }

    window.addEventListener("message", handlePopupMessage)

    return () => {
      window.removeEventListener("message", handlePopupMessage)
      clearPopupWatcher()
      closePopupWindow()
    }
  }, [router, safeTarget])

  function readAuthorizationUrl(result: unknown): string | null {
    if (!result || typeof result !== "object") {
      return null
    }

    const parsedResult = result as Record<string, unknown>

    if (typeof parsedResult.url === "string" && parsedResult.url.length > 0) {
      return parsedResult.url
    }

    if (!parsedResult.data || typeof parsedResult.data !== "object") {
      return null
    }

    const parsedData = parsedResult.data as Record<string, unknown>

    if (typeof parsedData.url !== "string" || parsedData.url.length === 0) {
      return null
    }

    return parsedData.url
  }

  function openOAuthPopup(url: string, provider: SocialProvider) {
    const width = 540
    const height = 700
    const left = window.screenX + Math.max((window.outerWidth - width) / 2, 0)
    const top = window.screenY + Math.max((window.outerHeight - height) / 2, 0)
    const features = [
      "popup=yes",
      `width=${width}`,
      `height=${height}`,
      `left=${Math.floor(left)}`,
      `top=${Math.floor(top)}`,
      "resizable=yes",
      "scrollbars=yes",
    ].join(",")

    const popup = window.open(url, "capital-path-oauth-popup", features)

    if (!popup) {
      return null
    }

    if (popupClosedWatcherRef.current !== null) {
      window.clearInterval(popupClosedWatcherRef.current)
    }

    popupWindowRef.current = popup
    popupClosedWatcherRef.current = window.setInterval(() => {
      if (!popupWindowRef.current || popupWindowRef.current.closed) {
        if (popupClosedWatcherRef.current !== null) {
          window.clearInterval(popupClosedWatcherRef.current)
          popupClosedWatcherRef.current = null
        }

        popupWindowRef.current = null
        setPendingProvider((current) => (current === provider ? null : current))
      }
    }, 350)

    return popup
  }

  async function signInWithProvider(provider: SocialProvider) {
    if (isSocialSignInPending) {
      return
    }

    setPendingProvider(provider)

    try {
      const popupCallbackUrl = `/oauth-popup-complete?target=${encodeURIComponent(safeTarget)}`
      const result = await authClient.signIn.social({
        provider,
        callbackURL: popupCallbackUrl,
        disableRedirect: true,
      })

      if (result.error) {
        toast.error(result.error.message ?? dictionary.common.unknownError)
        setPendingProvider(null)
        return
      }

      const authorizationUrl = readAuthorizationUrl(result)

      if (!authorizationUrl) {
        toast.error(dictionary.common.unknownError)
        setPendingProvider(null)
        return
      }

      const popupWindow = openOAuthPopup(authorizationUrl, provider)

      if (!popupWindow) {
        window.location.assign(authorizationUrl)
      }
    } catch {
      toast.error(dictionary.common.unknownError)
      setPendingProvider(null)
    }
  }

  const authPanel = (
    <SignInAuthPanel
      callbackUrl={callbackUrl}
      isSocialSignInPending={isSocialSignInPending}
      isGithubPending={isGithubPending}
      isGooglePending={isGooglePending}
      title={dictionary.auth.title}
      subtitle={dictionary.auth.subtitle}
      pendingLabel={dictionary.auth.pending}
      continueWithGithubLabel={dictionary.auth.continueWithGithub}
      continueWithGoogleLabel={dictionary.auth.continueWithGoogle}
      separatorLabel={dictionary.auth.separator}
      onSignInWithProvider={signInWithProvider}
    />
  )

  if (!breakpoint.up("lg")) {
    return (
      <SignInMobileLayout
        breakpoint={breakpoint}
        state={{ authPanel }}
        actions={{}}
      />
    )
  }

  return (
    <SignInDesktopLayout
      breakpoint={breakpoint}
      state={{
        authPanel,
        heroPanel: (
          <SignInHeroPanel
            locale={locale}
            brandLabel="Capital Path"
            heroTitle={dictionary.auth.heroTitle}
            heroBody={dictionary.auth.heroBody}
            heroCardTitle={dictionary.auth.heroCardTitle}
            heroCardBody={dictionary.auth.heroCardBody}
            chartSalaryLabel={dictionary.auth.chartSalaryLabel}
            chartCompanyLabel={dictionary.auth.chartCompanyLabel}
            chartEventTypeLabel={dictionary.auth.chartEventTypeLabel}
            chartIncreaseLabel={dictionary.auth.chartIncreaseLabel}
            chartPeriodLabel={dictionary.auth.chartPeriodLabel}
            chartDateLabel={dictionary.auth.chartDateLabel}
          />
        ),
      }}
      actions={{}}
    />
  )
}
