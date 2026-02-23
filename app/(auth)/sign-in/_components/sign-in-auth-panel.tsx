"use client"

import { GithubIcon } from "lucide-react"

import { EmailAuthForm } from "@/app/(auth)/sign-in/_components/email-auth-form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type SocialProvider = "github" | "google"

interface SignInAuthPanelProps {
  callbackUrl?: string
  isSocialSignInPending: boolean
  isGithubPending: boolean
  isGooglePending: boolean
  title: string
  subtitle: string
  pendingLabel: string
  continueWithGithubLabel: string
  continueWithGoogleLabel: string
  separatorLabel: string
  onSignInWithProvider: (provider: SocialProvider) => void
}

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

export function SignInAuthPanel({
  callbackUrl,
  isSocialSignInPending,
  isGithubPending,
  isGooglePending,
  title,
  subtitle,
  pendingLabel,
  continueWithGithubLabel,
  continueWithGoogleLabel,
  separatorLabel,
  onSignInWithProvider,
}: SignInAuthPanelProps) {
  return (
    <div>
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            CP
          </span>
          Capital Path
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="text-base text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="relative h-11 w-full overflow-hidden rounded-xl border-border bg-background text-sm data-[pending=true]:disabled:opacity-100"
          onClick={() => onSignInWithProvider("github")}
          disabled={isSocialSignInPending}
          aria-busy={isGithubPending}
          data-pending={isGithubPending ? "true" : undefined}
        >
          {isGithubPending ? (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <span className="absolute inset-0 origin-left bg-primary/35 animate-[oauth-signin-fill_3s_linear_forwards] motion-reduce:animate-none" />
            </span>
          ) : null}

          <span className="relative z-10 inline-flex items-center gap-2">
            <GithubIcon className="size-4" />
            {isGithubPending ? pendingLabel : continueWithGithubLabel}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="relative h-11 w-full overflow-hidden rounded-xl border-border bg-background text-sm data-[pending=true]:disabled:opacity-100"
          onClick={() => onSignInWithProvider("google")}
          disabled={isSocialSignInPending}
          aria-busy={isGooglePending}
          data-pending={isGooglePending ? "true" : undefined}
        >
          {isGooglePending ? (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <span className="absolute inset-0 origin-left bg-primary/35 animate-[oauth-signin-fill_3s_linear_forwards] motion-reduce:animate-none" />
            </span>
          ) : null}

          <span className="relative z-10 inline-flex items-center gap-2">
            <GoogleIcon className="size-4" />
            {isGooglePending ? pendingLabel : continueWithGoogleLabel}
          </span>
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {separatorLabel}
        </span>
        <Separator className="flex-1" />
      </div>

      <EmailAuthForm callbackUrl={callbackUrl} />
    </div>
  )
}
