import type { AppRole } from "@/app/lib/auth/roles"

export type RouteAccess = "public" | "protected" | "admin"

export type RouteKey =
  | "explore"
  | "signIn"
  | "onboarding"
  | "personalPath"
  | "companies"
  | "comparison"
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
  mobilePrimary: boolean
  icon: NavIconKey
}

export const ROUTES: readonly AppRouteDefinition[] = [
  {
    key: "explore",
    segment: "/explore",
    access: "public",
    protectedRoute: false,
    adminOnly: false,
    showInNavigation: false,
    mobilePrimary: false,
    icon: "sparkles",
  },
  {
    key: "signIn",
    segment: "/sign-in",
    access: "public",
    protectedRoute: false,
    adminOnly: false,
    showInNavigation: false,
    mobilePrimary: false,
    icon: "grid",
  },
  {
    key: "onboarding",
    segment: "/onboarding",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: false,
    mobilePrimary: false,
    icon: "sparkles",
  },
  {
    key: "personalPath",
    segment: "/personal-path",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    mobilePrimary: true,
    icon: "grid",
  },
  {
    key: "companies",
    segment: "/companies",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    mobilePrimary: true,
    icon: "briefcase",
  },
  {
    key: "comparison",
    segment: "/comparison",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    mobilePrimary: false,
    icon: "chart",
  },
  {
    key: "profile",
    segment: "/profile",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    mobilePrimary: true,
    icon: "user",
  },
  {
    key: "settings",
    segment: "/settings",
    access: "protected",
    protectedRoute: true,
    adminOnly: false,
    showInNavigation: true,
    mobilePrimary: true,
    icon: "settings",
  },
  {
    key: "adminUsers",
    segment: "/admin/users",
    access: "admin",
    protectedRoute: true,
    adminOnly: true,
    showInNavigation: true,
    mobilePrimary: false,
    icon: "users",
  },
  {
    key: "adminUserDetail",
    segment: "/admin/users/[userId]",
    access: "admin",
    protectedRoute: true,
    adminOnly: true,
    showInNavigation: false,
    mobilePrimary: false,
    icon: "users",
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

export function getMobilePrimaryRoutes(role: AppRole): AppRouteDefinition[] {
  return getNavigationRoutes(role).filter((route) => route.mobilePrimary)
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
