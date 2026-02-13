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

import type { RouteKey, NavIconKey } from "@/app/lib/navigation/route-config"
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
      return dictionary.navigation.personalPath
    case "companies":
      return dictionary.navigation.companies
    case "comparison":
      return dictionary.navigation.comparison
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
