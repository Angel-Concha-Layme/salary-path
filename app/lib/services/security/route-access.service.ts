import type {
  RouteAccessEmailOtpSendResponse,
  RouteAccessEmailOtpVerifyResponse,
  RouteAccessStatusResponse,
} from "@/app/lib/models/security/route-access.model"
import type { RouteStepUpKey } from "@/app/lib/security/route-protection-config"
import { apiClient } from "@/app/lib/services/api-client"

export interface RouteAccessRequestOptions {
  signal?: AbortSignal
}

async function getRouteAccessStatus(
  routeKey: RouteStepUpKey,
  options: RouteAccessRequestOptions = {}
) {
  return apiClient.get<RouteAccessStatusResponse>("/route-access/status", {
    query: {
      routeKey,
    },
    signal: options.signal,
  })
}

async function sendRouteEmailOtp(
  routeKey: RouteStepUpKey,
  options: RouteAccessRequestOptions = {}
) {
  return apiClient.post<RouteAccessEmailOtpSendResponse>("/route-access/email-otp/send", {
    json: {
      routeKey,
    },
    signal: options.signal,
  })
}

async function verifyRouteEmailOtp(
  routeKey: RouteStepUpKey,
  code: string,
  options: RouteAccessRequestOptions = {}
) {
  return apiClient.post<RouteAccessEmailOtpVerifyResponse>("/route-access/email-otp/verify", {
    json: {
      routeKey,
      code,
    },
    signal: options.signal,
  })
}

export const routeAccessService = {
  getRouteAccessStatus,
  sendRouteEmailOtp,
  verifyRouteEmailOtp,
}

