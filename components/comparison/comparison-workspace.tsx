"use client"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { ComparisonOnboardingWizard } from "@/components/comparison/comparison-onboarding-wizard"
import { RouteScreen } from "@/components/layout/route-screen"

export function ComparisonWorkspace() {
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
