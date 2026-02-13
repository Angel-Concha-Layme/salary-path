"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"

import type { OnboardingCompleteInput } from "@/app/lib/models/onboarding/onboarding.model"
import { useDomainMutation } from "@/app/hooks/use-domain-mutation"
import { onboardingService } from "@/app/lib/services/onboarding/onboarding.service"
import { queryKeys } from "@/app/lib/services/query-keys"

export function getOnboardingStatusQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.onboarding.status(),
    queryFn: ({ signal }) => onboardingService.getOnboardingStatus({ signal }),
    staleTime: 1000 * 30,
  })
}

export function useOnboardingStatusQuery() {
  return useQuery(getOnboardingStatusQueryOptions())
}

export function useCompleteOnboardingMutation() {
  return useDomainMutation({
    domain: "onboarding",
    mutationFn: (input: OnboardingCompleteInput) => onboardingService.completeOnboarding(input),
  })
}
