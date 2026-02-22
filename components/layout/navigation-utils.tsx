import type { ComponentType } from "react"
import {
  BriefcaseBusinessIcon,
  ChartSplineIcon,
  Grid2x2Icon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

import type {
  RouteKey,
  NavIconKey,
  RouteGroupKey,
} from "@/app/lib/navigation/route-config"
import type { Dictionary } from "@/app/lib/i18n/get-dictionary"

const iconMap: Record<NavIconKey, ComponentType<{ className?: string }>> = {
  grid: Grid2x2Icon,
  briefcase: BriefcaseBusinessIcon,
  user: UserIcon,
  settings: SettingsIcon,
  chart: ChartSplineIcon,
  users: UsersIcon,
  sparkles: SparklesIcon,
}

export function NavigationIcon({
  icon,
  className,
}: {
  icon: NavIconKey
  className?: string
}) {
  const Icon = iconMap[icon]

  return <Icon className={className} />
}

export function getRouteLabel(dictionary: Dictionary, key: RouteKey): string {
  switch (key) {
    case "explore":
      return dictionary.navigation.explore
    case "signIn":
      return dictionary.auth.signIn
    case "onboarding":
      return dictionary.navigation.onboarding
    case "personalPath":
      return dictionary.navigation.salaryTracking
    case "companies":
      return dictionary.navigation.companies
    case "comparison":
      return dictionary.navigation.comparison
    case "growthPrediction":
      return dictionary.navigation.growthPrediction
    case "taxesPeru":
      return dictionary.navigation.taxesPeru
    case "savingsProjection":
      return dictionary.navigation.savingsProjection
    case "investmentSimulator":
      return dictionary.navigation.investmentSimulator
    case "taxStrategies":
      return dictionary.navigation.taxStrategies
    case "mortgageEligibility":
      return dictionary.navigation.mortgageEligibility
    case "installmentSimulator":
      return dictionary.navigation.installmentSimulator
    case "projectsMap":
      return dictionary.navigation.projectsMap
    case "financialMatching":
      return dictionary.navigation.financialMatching
    case "profile":
      return dictionary.navigation.profile
    case "settings":
      return dictionary.navigation.settings
    case "adminUsers":
    case "adminUserDetail":
      return dictionary.navigation.adminUsers
    default:
      return key
  }
}

export function getNavigationGroupLabel(
  dictionary: Dictionary,
  key: RouteGroupKey
): string {
  switch (key) {
    case "careerPath":
      return dictionary.navigation.careerPath
    case "financialEngine":
      return dictionary.navigation.financialEngine
    case "homePath":
      return dictionary.navigation.homePath
    case "account":
      return dictionary.navigation.account
    case "admin":
      return dictionary.permissions.admin
    default:
      return key
  }
}
