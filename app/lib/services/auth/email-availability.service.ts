import type { EmailAvailabilityResponse } from "@/app/lib/models/auth/email-availability.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface CheckEmailAvailabilityOptions {
  signal?: AbortSignal
}

async function checkEmailAvailability(
  email: string,
  options: CheckEmailAvailabilityOptions = {}
) {
  return apiClient.get<EmailAvailabilityResponse>("/auth/email-availability", {
    query: { email },
    signal: options.signal,
  })
}

export const authEmailAvailabilityService = {
  checkEmailAvailability,
}
