import type {
  OnboardingCompleteInput,
  OnboardingCompleteResponse,
  OnboardingStatusResponse,
} from "@/app/lib/models/onboarding/onboarding.model"
import { apiClient } from "@/app/lib/services/api-client"

export interface GetOnboardingStatusOptions {
  signal?: AbortSignal
}

export interface CompleteOnboardingOptions {
  signal?: AbortSignal
}

async function getOnboardingStatus(options: GetOnboardingStatusOptions = {}) {
  return apiClient.get<OnboardingStatusResponse>("/onboarding/status", {
    signal: options.signal,
  })
}

async function completeOnboarding(
  input: OnboardingCompleteInput,
  options: CompleteOnboardingOptions = {}
) {
  return apiClient.post<OnboardingCompleteResponse>("/onboarding/complete", {
    json: input,
    signal: options.signal,
  })
}

export const onboardingService = {
  getOnboardingStatus,
  completeOnboarding,
}
