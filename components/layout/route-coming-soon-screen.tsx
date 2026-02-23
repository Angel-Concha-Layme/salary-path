"use client"

import type { RouteKey } from "@/app/lib/navigation/route-config"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { getRouteLabel } from "@/components/layout/navigation-utils"
import { RouteScreen } from "@/components/layout/route-screen"
import { Badge } from "@/components/ui/badge"

interface RouteComingSoonScreenProps {
  routeKey: RouteKey
}

export function RouteComingSoonScreen({ routeKey }: RouteComingSoonScreenProps) {
  const { dictionary } = useDictionary()
  const title = getRouteLabel(dictionary, routeKey)

  return (
    <RouteScreen title={title} subtitle={dictionary.common.comingSoon}>
      <section className="flex min-h-[56vh] items-center justify-center">
        <Badge
          variant="outline"
          className="rounded-full border-border/70 px-3 py-1 text-[0.68rem] font-medium tracking-[0.16em] uppercase"
        >
          {dictionary.common.comingSoon}
        </Badge>
      </section>
    </RouteScreen>
  )
}
