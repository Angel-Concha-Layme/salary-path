"use client"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { ComparisonOnboardingWizard } from "@/app/(protected-app)/career-path/comparison/_components/comparison-onboarding-wizard"
import { RouteScreen } from "@/components/layout/route-screen"

export function ComparisonScreen() {
  const { dictionary } = useDictionary()

  return (
    <RouteScreen
      title={dictionary.navigation.comparison}
      subtitle={dictionary.comparisonOnboarding.subtitle}
    >
      <ComparisonOnboardingWizard />
    </RouteScreen>
  )
}
