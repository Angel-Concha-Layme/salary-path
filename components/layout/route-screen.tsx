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
  isLoading?: boolean
  className?: string
  bodyClassName?: string
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
  isLoading = false,
  className,
  bodyClassName,
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
        "relative min-h-full min-w-0 w-full max-w-full pb-24 shadow-none lg:pb-3",
        "[--chart-1:oklch(0.35_0_0)] [--chart-2:oklch(0.45_0_0)] [--chart-3:oklch(0.55_0_0)] [--chart-4:oklch(0.65_0_0)] [--chart-5:oklch(0.75_0_0)]",
        "dark:[--chart-1:oklch(0.88_0_0)] dark:[--chart-2:oklch(0.80_0_0)] dark:[--chart-3:oklch(0.72_0_0)] dark:[--chart-4:oklch(0.64_0_0)] dark:[--chart-5:oklch(0.56_0_0)]",
        "[&_*]:!shadow-none [&_*]:!drop-shadow-none",
        className
      )}
    >
      <header
        data-route-screen-search-ignore="true"
        className={cn(
          "sticky top-0 z-30 w-full overflow-hidden border-b border-black/10 bg-background lg:rounded-t-[1.35rem] lg:rounded-b-none dark:border-white/10",
          headerClassName
        )}
      >
        <div className="space-y-0.5 bg-white px-4 py-2 dark:bg-black">
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
      </header>

      <section
        data-slot="route-screen-body"
        className={cn("mt-4 space-y-5 px-3 pb-3", bodyClassName)}
      >
        {children}
      </section>

      {isLoading ? (
        <div
          aria-live="polite"
          aria-busy="true"
          className="absolute inset-0 z-40 flex items-center justify-center bg-background/55 backdrop-blur-[2px]"
        >
          <div className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/75 p-3 shadow-sm">
            <span className="block size-6 rounded-full border-2 border-black/15 border-t-black/75 animate-spin dark:border-white/20 dark:border-t-white/80" />
          </div>
          <span className="sr-only">{dictionary.common.loading}</span>
        </div>
      ) : null}
    </div>
  )
}
