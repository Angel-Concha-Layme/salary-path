import { z } from "zod"

import { ROUTE_STEP_UP_KEYS, type RouteStepUpKey } from "@/app/lib/security/route-protection-config"

const OTP_CODE_REGEX = /^\d{6}$/

export const routeStepUpKeySchema = z.enum(ROUTE_STEP_UP_KEYS)

export const routeEmailOtpCodeSchema = z
  .string()
  .trim()
  .regex(OTP_CODE_REGEX, "Verification code must contain exactly 6 digits")

export const routeAccessSendRequestSchema = z.object({
  routeKey: routeStepUpKeySchema,
})

export const routeAccessVerifyRequestSchema = z.object({
  routeKey: routeStepUpKeySchema,
  code: routeEmailOtpCodeSchema,
})

export const routeAccessStatusQuerySchema = z.object({
  routeKey: routeStepUpKeySchema,
})

export type RouteAccessSendRequest = z.infer<typeof routeAccessSendRequestSchema>
export type RouteAccessVerifyRequest = z.infer<typeof routeAccessVerifyRequestSchema>
export type RouteAccessStatusQuery = z.infer<typeof routeAccessStatusQuerySchema>

export interface RouteAccessStatusResponse {
  routeKey: RouteStepUpKey
  required: boolean
  verified: boolean
  verificationExpiresAt: string | null
  challengeActive: boolean
  challengeExpiresAt: string | null
  remainingSends24h: number
  resendAvailableAt: string | null
}

export interface RouteAccessEmailOtpSendResponse {
  routeKey: RouteStepUpKey
  challengeExpiresAt: string
  resendAvailableAt: string
  remainingSends24h: number
}

export interface RouteAccessEmailOtpVerifyResponse {
  routeKey: RouteStepUpKey
  verified: true
  verificationExpiresAt: string
}

