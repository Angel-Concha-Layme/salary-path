"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCwIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  useRouteAccessStatusQuery,
  useSendRouteEmailOtpMutation,
  useVerifyRouteEmailOtpMutation,
} from "@/app/hooks/security/use-route-access"
import type { RouteAccessStatusResponse } from "@/app/lib/models/security/route-access.model"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import type { RouteStepUpKey } from "@/app/lib/security/route-protection-config"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { ApiClientError } from "@/app/types/api"

interface RouteEmailOtpGateProps {
  routeKey: RouteStepUpKey
  userEmail: string
  initialStatus: RouteAccessStatusResponse
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function RouteEmailOtpGate({
  routeKey,
  userEmail,
  initialStatus,
}: RouteEmailOtpGateProps) {
  const { dictionary } = useDictionary()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const statusQuery = useRouteAccessStatusQuery(routeKey, {
    initialData: initialStatus,
  })
  const sendMutation = useSendRouteEmailOtpMutation(routeKey)
  const verifyMutation = useVerifyRouteEmailOtpMutation(routeKey)

  const status = statusQuery.data ?? initialStatus
  const resendAvailableAtMs = status.resendAvailableAt
    ? new Date(status.resendAvailableAt).getTime()
    : null
  const resendCooldownSeconds = useMemo(() => {
    if (!resendAvailableAtMs) {
      return 0
    }

    return Math.max(0, Math.ceil((resendAvailableAtMs - nowMs) / 1000))
  }, [nowMs, resendAvailableAtMs])
  const canResend = status.remainingSends24h > 0 && resendCooldownSeconds === 0
  const sendButtonLabel = status.challengeActive
    ? dictionary.routeAccess.resendCode
    : dictionary.routeAccess.sendCode

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  function handleSendCode() {
    if (!canResend || sendMutation.isPending) {
      return
    }

    setFormError(null)
    sendMutation.mutate(undefined, {
      onError(error) {
        if (error instanceof ApiClientError && error.code === "ROUTE_OTP_DAILY_LIMIT") {
          setFormError(dictionary.routeAccess.dailyLimitError)
          return
        }

        if (error instanceof ApiClientError && error.code === "ROUTE_OTP_COOLDOWN") {
          setFormError(dictionary.routeAccess.cooldownError)
          return
        }

        if (error instanceof ApiClientError && error.code === "EMAIL_PROVIDER_NOT_CONFIGURED") {
          setFormError(dictionary.routeAccess.emailProviderNotConfigured)
          return
        }

        setFormError(dictionary.routeAccess.sendError)
      },
    })
  }

  function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (code.length !== 6 || verifyMutation.isPending) {
      return
    }

    setFormError(null)
    verifyMutation.mutate(code, {
      onSuccess() {
        router.refresh()
      },
      onError(error) {
        if (error instanceof ApiClientError && error.code === "ROUTE_OTP_INVALID_OR_EXPIRED") {
          setFormError(dictionary.routeAccess.invalidCodeError)
          return
        }

        if (error instanceof ApiClientError && error.code === "ROUTE_OTP_ATTEMPTS_EXCEEDED") {
          setFormError(dictionary.routeAccess.attemptsExceededError)
          return
        }

        setFormError(dictionary.routeAccess.verifyError)
      },
    })
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-4">
      <form className="w-full" onSubmit={handleVerify}>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>{dictionary.routeAccess.title}</CardTitle>
            <CardDescription>
              {dictionary.routeAccess.description}{" "}
              <span className="font-medium">{userEmail}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="otp-verification">
                  {dictionary.routeAccess.codeLabel}
                </FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleSendCode}
                  disabled={!canResend || sendMutation.isPending}
                >
                  <RefreshCwIcon />
                  {sendButtonLabel}
                </Button>
              </div>
              <InputOTP
                maxLength={6}
                id="otp-verification"
                required
                value={code}
                pattern="^[0-9]+$"
                onChange={(value) => {
                  setCode(value.replace(/\D/g, ""))
                }}
              >
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-2" />
                <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                {status.remainingSends24h > 0
                  ? dictionary.routeAccess.remainingSends.replace(
                      "{remaining}",
                      String(status.remainingSends24h)
                    )
                  : dictionary.routeAccess.dailyLimitError}
              </FieldDescription>
              {resendCooldownSeconds > 0 ? (
                <FieldDescription>
                  {dictionary.routeAccess.cooldownCountdown.replace(
                    "{time}",
                    formatCountdown(resendCooldownSeconds)
                  )}
                </FieldDescription>
              ) : null}
              <FieldError>{formError}</FieldError>
            </Field>
          </CardContent>
          <CardFooter>
            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || verifyMutation.isPending}
              >
                {verifyMutation.isPending
                  ? dictionary.routeAccess.verifying
                  : dictionary.routeAccess.verifyAction}
              </Button>
              <div className="text-muted-foreground text-sm">
                {dictionary.routeAccess.troubleText}{" "}
                <a
                  href="#"
                  className="hover:text-primary underline underline-offset-4 transition-colors"
                >
                  {dictionary.routeAccess.contactSupport}
                </a>
              </div>
            </Field>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
