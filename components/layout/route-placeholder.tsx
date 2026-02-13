"use client"

import type { RouteAccess, RouteKey } from "@/app/lib/navigation/route-config"
import type { Dictionary } from "@/app/lib/i18n/get-dictionary"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { getRouteLabel } from "@/components/layout/navigation-utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RoutePlaceholderProps {
  routeKey: RouteKey
  access: RouteAccess
  protectedRoute: boolean
}

function getAccessLabel(access: RouteAccess, dictionary: Dictionary): string {
  switch (access) {
    case "public":
      return dictionary.permissions.public
    case "protected":
      return dictionary.permissions.protected
    case "admin":
      return dictionary.permissions.admin
    default:
      return access
  }
}

export function RoutePlaceholder({
  routeKey,
  access,
  protectedRoute,
}: RoutePlaceholderProps) {
  const { dictionary } = useDictionary()
  const title = getRouteLabel(dictionary, routeKey)
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl rounded-2xl border border-border">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">
              {dictionary.permissions.accessLabel}: 
            </span>
            {getAccessLabel(access, dictionary)}
          </p>
          <p>
            <span className="font-semibold text-foreground">
              {dictionary.permissions.requiresAuthLabel}: 
            </span>
            {protectedRoute ? dictionary.permissions.yes : dictionary.permissions.no}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
