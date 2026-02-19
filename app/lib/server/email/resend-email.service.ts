import { Resend } from "resend"

import type { RouteStepUpKey } from "@/app/lib/security/route-protection-config"
import { ApiError } from "@/app/lib/server/api-error"

const MAX_SEND_ATTEMPTS = 3

let resendClient: Resend | null = null

interface ResendConfig {
  apiKey: string
  fromEmail: string
  replyTo?: string
}

export interface SendRouteOtpEmailInput {
  ownerUserId: string
  email: string
  routeKey: RouteStepUpKey
  code: string
  challengeId: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getResendConfigOrThrow(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim()
  const replyTo = process.env.RESEND_REPLY_TO?.trim()

  if (!apiKey || !fromEmail) {
    throw new ApiError(
      500,
      "EMAIL_PROVIDER_NOT_CONFIGURED",
      "Email provider is not configured"
    )
  }

  return {
    apiKey,
    fromEmail,
    replyTo: replyTo || undefined,
  }
}

function getResendClient(config: ResendConfig): Resend {
  if (resendClient) {
    return resendClient
  }

  resendClient = new Resend(config.apiKey)
  return resendClient
}

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null
  }

  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status
  }

  return null
}

function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error)

  if (status === 429 || status === 500) {
    return true
  }

  return false
}

function mapResendError(error: unknown): ApiError {
  const status = getErrorStatus(error)

  if (status === 400 || status === 401 || status === 403 || status === 409 || status === 422) {
    return new ApiError(500, "EMAIL_DELIVERY_FAILED", "Unable to deliver verification email")
  }

  return new ApiError(500, "EMAIL_DELIVERY_FAILED", "Unable to deliver verification email")
}

export async function sendRouteOtpEmail({
  ownerUserId,
  email,
  routeKey,
  code,
  challengeId,
}: SendRouteOtpEmailInput): Promise<void> {
  const config = getResendConfigOrThrow()
  const resend = getResendClient(config)
  const idempotencyKey = `route-otp/${ownerUserId}/${routeKey}/${challengeId}`
  const subject = "Salary Path verification code"
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Verify access to ${routeKey}</h2>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
      <p>This code expires in 5 hours.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `
  const text = `Verify access to ${routeKey}. Your verification code is ${code}. This code expires in 5 hours.`

  let lastError: unknown = null

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    let error: unknown = null

    try {
      const result = await resend.emails.send(
        {
          from: config.fromEmail,
          to: [email],
          subject,
          html,
          text,
          replyTo: config.replyTo ? [config.replyTo] : undefined,
        },
        {
          idempotencyKey,
        }
      )
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    if (!error) {
      return
    }

    lastError = error

    if (!isRetryableError(error) || attempt >= MAX_SEND_ATTEMPTS) {
      break
    }

    const backoffMs = 500 * 2 ** (attempt - 1)
    await sleep(backoffMs)
  }

  throw mapResendError(lastError)
}
