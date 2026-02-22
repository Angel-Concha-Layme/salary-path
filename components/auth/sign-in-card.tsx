"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { GithubIcon } from "lucide-react"
import { toast } from "sonner"

import {
  getSafeInternalTarget,
  isOAuthPopupCompleteMessage,
} from "@/app/lib/auth/oauth-popup"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { authClient } from "@/app/lib/auth/client"
import { EmailAuthForm } from "@/components/auth/email-auth-form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface SignInCardProps {
  callbackUrl?: string
}

type SocialProvider = "github" | "google"

const SalaryProgressionPreviewChart = dynamic(
  () =>
    import("@/components/charts/salary-progression-preview-chart").then(
      (mod) => mod.SalaryProgressionPreviewChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="mt-5 h-[300px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    ),
  }
)

function GoogleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.05 5.05 0 0 1-2.2 3.32v2.73h3.57c2.1-1.94 3.27-4.8 3.27-8.06Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.96 0 5.45-.98 7.28-2.69l-3.57-2.73c-1 .68-2.28 1.08-3.7 1.08-2.83 0-5.22-1.91-6.08-4.48H2.24v2.81A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.92 14.18a6.65 6.65 0 0 1 0-4.36V7H2.24a11.06 11.06 0 0 0 0 9.99l3.68-2.81Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.34c1.51 0 2.88.52 3.96 1.55l2.96-2.96C17.45 2.58 14.96 1 12 1a11 11 0 0 0-9.76 6l3.68 2.82C6.78 7.24 9.17 5.34 12 5.34Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function SignInCard({
  callbackUrl,
}: SignInCardProps) {
  const { dictionary, locale } = useDictionary()
  const router = useRouter()
  const popupWindowRef = useRef<Window | null>(null)
  const popupClosedWatcherRef = useRef<number | null>(null)
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null)
  const isSocialSignInPending = pendingProvider !== null
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

  const isGithubPending = pendingProvider === "github"
  const isGooglePending = pendingProvider === "google"

  return (
    <section className="min-h-screen w-full bg-background lg:grid lg:grid-cols-[minmax(360px,0.38fr)_minmax(0,0.62fr)]">
      <div className="flex items-center justify-center bg-muted/35 px-6 py-10 sm:px-10 lg:px-10 xl:px-16">
        <div className="w-full max-w-md">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                CP
              </span>
              Capital Path
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">{dictionary.auth.title}</h1>
              <p className="text-base text-muted-foreground">{dictionary.auth.subtitle}</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="relative h-11 w-full overflow-hidden rounded-xl border-border bg-background text-sm data-[pending=true]:disabled:opacity-100"
              onClick={() => signInWithProvider("github")}
              disabled={isSocialSignInPending}
              aria-busy={isGithubPending}
              data-pending={isGithubPending ? "true" : undefined}
            >
              {isGithubPending ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                >
                  <span className="absolute inset-0 origin-left bg-primary/35 animate-[oauth-signin-fill_3s_linear_forwards] motion-reduce:animate-none" />
                </span>
              ) : null}

              <span className="relative z-10 inline-flex items-center gap-2">
                <GithubIcon className="size-4" />
                {isGithubPending ? dictionary.auth.pending : dictionary.auth.continueWithGithub}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="relative h-11 w-full overflow-hidden rounded-xl border-border bg-background text-sm data-[pending=true]:disabled:opacity-100"
              onClick={() => signInWithProvider("google")}
              disabled={isSocialSignInPending}
              aria-busy={isGooglePending}
              data-pending={isGooglePending ? "true" : undefined}
            >
              {isGooglePending ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                >
                  <span className="absolute inset-0 origin-left bg-primary/35 animate-[oauth-signin-fill_3s_linear_forwards] motion-reduce:animate-none" />
                </span>
              ) : null}

              <span className="relative z-10 inline-flex items-center gap-2">
                <GoogleIcon className="size-4" />
                {isGooglePending ? dictionary.auth.pending : dictionary.auth.continueWithGoogle}
              </span>
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {dictionary.auth.separator}
            </span>
            <Separator className="flex-1" />
          </div>

          <EmailAuthForm callbackUrl={callbackUrl} />
        </div>
      </div>

      <aside className="hidden items-center justify-center bg-background p-4 lg:flex xl:p-6">
        <div className="relative flex min-h-[calc(100vh-2rem)] w-full max-w-[1080px] flex-col overflow-hidden rounded-3xl border border-zinc-200/10 bg-zinc-950 p-8 text-zinc-100 shadow-2xl xl:min-h-[calc(100vh-3rem)] xl:p-10">
          <div className="absolute -left-16 top-8 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute bottom-6 right-[-88px] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_24%,rgba(255,255,255,0.1),transparent_34%),radial-gradient(circle_at_82%_84%,rgba(255,255,255,0.12),transparent_32%)]" />

          <div className="relative space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">
              Capital Path
            </p>
            <h2 className="max-w-2xl text-4xl leading-tight font-semibold xl:text-5xl">
              {dictionary.auth.heroTitle}
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-zinc-300">
              {dictionary.auth.heroBody}
            </p>
          </div>

          <div className="relative mt-auto rounded-3xl border border-zinc-200/20 bg-white p-7 text-slate-900 shadow-2xl xl:p-8">
            <h3 className="text-4xl leading-tight font-semibold xl:text-5xl">{dictionary.auth.heroCardTitle}</h3>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
              {dictionary.auth.heroCardBody}
            </p>
            <SalaryProgressionPreviewChart
              locale={locale}
              salaryLabel={dictionary.auth.chartSalaryLabel}
              companyLabel={dictionary.auth.chartCompanyLabel}
              eventTypeLabel={dictionary.auth.chartEventTypeLabel}
              increaseLabel={dictionary.auth.chartIncreaseLabel}
              periodLabel={dictionary.auth.chartPeriodLabel}
              dateLabel={dictionary.auth.chartDateLabel}
            />
          </div>
        </div>
      </aside>
    </section>
  )
}
