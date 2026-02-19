import type { RouteKey } from "@/app/lib/navigation/route-config"

export type RouteStepUpMethod = "email_otp"

export interface RouteProtectionPolicy {
  enabled: boolean
  method: RouteStepUpMethod
  ttlHours: number
  maxSendsPer24Hours: number
  resendCooldownSeconds: number
  maxAttempts: number
}

export const ROUTE_STEP_UP_KEYS = ["comparison"] as const satisfies readonly RouteKey[]

export type RouteStepUpKey = (typeof ROUTE_STEP_UP_KEYS)[number]

const ROUTE_PROTECTION_POLICIES: Record<RouteStepUpKey, RouteProtectionPolicy> = {
  comparison: {
    enabled: true,
    method: "email_otp",
    ttlHours: 5,
    maxSendsPer24Hours: 3,
    resendCooldownSeconds: 60,
    maxAttempts: 5,
  },
}

export function isRouteStepUpProtected(routeKey: RouteKey): routeKey is RouteStepUpKey {
  return routeKey in ROUTE_PROTECTION_POLICIES
}

export function getRouteProtectionPolicy(routeKey: RouteKey): RouteProtectionPolicy | null {
  if (!isRouteStepUpProtected(routeKey)) {
    return null
  }

  const policy = ROUTE_PROTECTION_POLICIES[routeKey]

  if (!policy?.enabled) {
    return null
  }

  return policy
}

