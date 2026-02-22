"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { usePathname } from "next/navigation"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { getRoutePath, ROUTES } from "@/app/lib/navigation/route-config"
import { RouteScreenHeaderActions } from "@/components/layout/route-screen-header-actions"
import { getNavigationGroupLabel, getRouteLabel } from "@/components/layout/navigation-utils"
import { cn } from "@/lib/utils"

interface RouteScreenProps {
  title: ReactNode
  subtitle?: ReactNode
  headerActions?: ReactNode
  className?: string
  headerClassName?: string
  titleClassName?: string
  subtitleClassName?: string
  children: ReactNode
}

function isPathWithinSection(pathname: string, sectionPath: string): boolean {
  return pathname === sectionPath || pathname.startsWith(`${sectionPath}/`)
}

export function RouteScreen({
  title,
  subtitle,
  headerActions,
  className,
  headerClassName,
  titleClassName,
  subtitleClassName,
  children,
}: RouteScreenProps) {
  const pathname = usePathname()
  const { dictionary } = useDictionary()

  const activeRoute = useMemo(() => {
    const matches = ROUTES.filter(
      (route) =>
        route.showInNavigation && isPathWithinSection(pathname, getRoutePath(route.segment))
    ).sort((a, b) => getRoutePath(b.segment).length - getRoutePath(a.segment).length)

    return matches[0] ?? null
  }, [pathname])

  const sectionLabel =
    activeRoute?.group != null ? getNavigationGroupLabel(dictionary, activeRoute.group) : null
  const subSectionLabel = activeRoute ? getRouteLabel(dictionary, activeRoute.key) : null

  return (
    <div
      data-route-screen="true"
      className={cn(
        "min-h-full min-w-0 w-full max-w-full pb-24 shadow-none lg:pb-3",
        "[--primary:oklch(0.18_0_0)] [--primary-foreground:oklch(0.985_0_0)] [--ring:oklch(0.18_0_0)]",
        "[--chart-1:oklch(0.35_0_0)] [--chart-2:oklch(0.45_0_0)] [--chart-3:oklch(0.55_0_0)] [--chart-4:oklch(0.65_0_0)] [--chart-5:oklch(0.75_0_0)]",
        "dark:[--primary:oklch(0.985_0_0)] dark:[--primary-foreground:oklch(0.145_0_0)] dark:[--ring:oklch(0.985_0_0)]",
        "dark:[--chart-1:oklch(0.88_0_0)] dark:[--chart-2:oklch(0.80_0_0)] dark:[--chart-3:oklch(0.72_0_0)] dark:[--chart-4:oklch(0.64_0_0)] dark:[--chart-5:oklch(0.56_0_0)]",
        "[&_*]:!shadow-none [&_*]:!drop-shadow-none",
        className
      )}
    >
      <header
        data-route-screen-search-ignore="true"
        className={cn(
          "sticky top-0 z-30 w-full border-b border-black/10 bg-background dark:border-white/10",
          headerClassName
        )}
      >
        <div className="-mt-1 px-3 pb-1 pt-0">
          <div className="space-y-0.5 rounded-xl bg-white px-4 py-2 dark:bg-black">
            <div className="flex min-w-0 items-center gap-2">
              {sectionLabel || subSectionLabel ? (
                <div className="flex min-w-0 items-center gap-2 text-xs text-black/60 dark:text-white/60">
                  {sectionLabel ? <span className="truncate">{sectionLabel}</span> : null}
                  {sectionLabel && subSectionLabel ? (
                    <span aria-hidden className="text-black/35 dark:text-white/35">
                      /
                    </span>
                  ) : null}
                  {subSectionLabel ? (
                    <span className="truncate font-medium text-black/80 dark:text-white/80">
                      {subSectionLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <RouteScreenHeaderActions settingsContent={headerActions} />
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <h1
                className={cn(
                  "-mt-1 min-w-0 flex-1 truncate text-xl leading-tight font-semibold tracking-tight text-black dark:text-white",
                  titleClassName
                )}
              >
                {title}
              </h1>
              {subtitle ? (
                <p
                  className={cn(
                    "hidden max-w-[52%] shrink-0 truncate text-right text-xs leading-snug text-black/70 dark:text-white/70 sm:block",
                    subtitleClassName
                  )}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section data-slot="route-screen-body" className="mt-4 space-y-5 px-3 pb-3">
        {children}
      </section>
    </div>
  )
}
