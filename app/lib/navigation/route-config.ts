import type { AppRole } from "@/app/lib/auth/roles"

export type RouteAccess = "public" | "protected" | "admin"
export type RouteGroupKey =
  | "careerPath"
  | "financialEngine"
  | "homePath"
  | "account"
  | "admin"

export type RouteKey =
  | "explore"
  | "signIn"
  | "onboarding"
  | "personalPath"
  | "companies"
  | "comparison"
  | "growthPrediction"
  | "taxesPeru"
  | "savingsProjection"
  | "investmentSimulator"
  | "taxStrategies"
  | "mortgageEligibility"
  | "installmentSimulator"
  | "projectsMap"
  | "financialMatching"
  | "profile"
  | "settings"
  | "adminUsers"
  | "adminUserDetail"

export type NavIconKey =
  | "grid"
  | "briefcase"
  | "user"
  | "settings"
  | "chart"
  | "users"
  | "sparkles"

export interface AppRouteDefinition {
  key: RouteKey
  segment: string
  access: RouteAccess
  protectedRoute: boolean
  adminOnly: boolean
  showInNavigation: boolean
  showInMobileMenu: boolean
  mobilePrimary: boolean
  icon: NavIconKey
  group: RouteGroupKey | null
}

export interface AppNavigationGroup {
  key: RouteGroupKey
  routes: AppRouteDefinition[]
}

export const ROUTES: readonly AppRouteDefinition[] = [
  {
    key: "explore",
    segment: "/explore",
    access: "public",
    protectedRoute: false,
    adminOnly: false,
    showInNavigation: false,
    showInMobileMenu: false,
    mobilePrimary: false,
    icon: "sparkles",
    group: null,
  },
  {
    key: "signIn",
    segment: "/sign-in",
    access: "public",
    protectedRoute: false,
    adminOnly: false,
    showInNavigation: false,
    showInMobileMenu: false,
    mobilePrimary: false,
    icon: "grid",
    group: null,
  },
  {
    key: "onboarding",
    segment: "/onboarding",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: false,
    showInMobileMenu: false,
    mobilePrimary: false,
    icon: "sparkles",
    group: null,
  },
  {
    key: "personalPath",
    segment: "/career-path/salary-tracking",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: false,
    mobilePrimary: true,
    icon: "grid",
    group: "careerPath",
  },
  {
    key: "companies",
    segment: "/career-path/companies",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "briefcase",
    group: "careerPath",
  },
  {
    key: "comparison",
    segment: "/career-path/comparison",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "chart",
    group: "careerPath",
  },
  {
    key: "growthPrediction",
    segment: "/career-path/growth-prediction",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "sparkles",
    group: "careerPath",
  },
  {
    key: "taxesPeru",
    segment: "/financial-engine/taxes-peru",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: false,
    mobilePrimary: true,
    icon: "grid",
    group: "financialEngine",
  },
  {
    key: "savingsProjection",
    segment: "/financial-engine/savings-projection",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "chart",
    group: "financialEngine",
  },
  {
    key: "investmentSimulator",
    segment: "/financial-engine/investment-simulator",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "briefcase",
    group: "financialEngine",
  },
  {
    key: "taxStrategies",
    segment: "/financial-engine/tax-strategies",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "settings",
    group: "financialEngine",
  },
  {
    key: "mortgageEligibility",
    segment: "/home-path/mortgage-eligibility",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: false,
    mobilePrimary: true,
    icon: "grid",
    group: "homePath",
  },
  {
    key: "installmentSimulator",
    segment: "/home-path/installment-simulator",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "chart",
    group: "homePath",
  },
  {
    key: "projectsMap",
    segment: "/home-path/projects-map",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "briefcase",
    group: "homePath",
  },
  {
    key: "financialMatching",
    segment: "/home-path/financial-matching",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "sparkles",
    group: "homePath",
  },
  {
    key: "profile",
    segment: "/profile",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: false,
    mobilePrimary: true,
    icon: "user",
    group: "account",
  },
  {
    key: "settings",
    segment: "/settings",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "settings",
    group: "account",
  },
  {
    key: "adminUsers",
    segment: "/admin/users",
    access: "admin",
    protectedRoute: true,
    adminOnly: true,
    showInNavigation: true,
    showInMobileMenu: true,
    mobilePrimary: false,
    icon: "users",
    group: "admin",
  },
  {
    key: "adminUserDetail",
    segment: "/admin/users/[userId]",
    access: "admin",
    protectedRoute: true,
    adminOnly: true,
    showInNavigation: false,
    showInMobileMenu: false,
    mobilePrimary: false,
    icon: "users",
    group: "admin",
  },
] as const

export function getRoutePath(segment: string): string {
  if (segment.startsWith("/")) {
    return segment
  }

  return `/${segment}`
}

export function getRouteBySegment(segment: string): AppRouteDefinition | undefined {
  return ROUTES.find((route) => route.segment === segment)
}

export function getNavigationRoutes(role: AppRole): AppRouteDefinition[] {
  return ROUTES.filter((route) => {
    if (!route.showInNavigation) {
      return false
    }

    if (route.adminOnly) {
      return role === "admin"
    }

    return true
  })
}

const NAVIGATION_GROUP_ORDER: readonly RouteGroupKey[] = [
  "careerPath",
  "financialEngine",
  "homePath",
  "account",
  "admin",
]

export function getNavigationGroups(role: AppRole): AppNavigationGroup[] {
  const navRoutes = getNavigationRoutes(role)

  return NAVIGATION_GROUP_ORDER
    .map((groupKey) => ({
      key: groupKey,
      routes: navRoutes.filter((route) => route.group === groupKey),
    }))
    .filter((group) => group.routes.length > 0)
}

export function getMobilePrimaryRoutes(role: AppRole): AppRouteDefinition[] {
  return getNavigationRoutes(role).filter((route) => route.mobilePrimary)
}

export function getMobileMenuRoutes(role: AppRole): AppRouteDefinition[] {
  return getNavigationRoutes(role).filter((route) => route.showInMobileMenu)
}

export function isProtectedSegment(pathname: string): boolean {
  return ROUTES.some(
    (route) => route.protectedRoute && pathname.startsWith(route.segment)
  )
}

export function isAdminSegment(pathname: string): boolean {
  return ROUTES.some(
    (route) => route.adminOnly && pathname.startsWith(route.segment)
  )
}
