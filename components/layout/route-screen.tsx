"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { usePathname } from "next/navigation"

import { useBreakpointData } from "@/app/hooks/use-breakpoint-data"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { getRoutePath, ROUTES } from "@/app/lib/navigation/route-config"
import { RouteScreenHeaderActions } from "@/components/layout/route-screen-header-actions"
import { getNavigationGroupLabel, getRouteLabel } from "@/components/layout/navigation-utils"
import { cn } from "@/lib/utils"

type RouteScreenMobileHeaderMode = "title" | "breadcrumbs"

interface RouteScreenProps {
  title: ReactNode
  subtitle?: ReactNode
  headerActions?: ReactNode
  mobileHeaderMode?: RouteScreenMobileHeaderMode
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
  mobileHeaderMode = "title",
  isLoading = false,
  className,
  bodyClassName,
  headerClassName,
  titleClassName,
  subtitleClassName,
  children,
}: RouteScreenProps) {
  const pathname = usePathname()
  const breakpoint = useBreakpointData()
  const { dictionary } = useDictionary()
  const useTitleOnlyMobileHeader =
    breakpoint.down("lg") && mobileHeaderMode === "title"
  const showBodySurface = breakpoint.up("lg")

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
        "relative flex min-h-full min-w-0 w-full max-w-full flex-col shadow-none",
        "[--route-screen-shell-radius:1.35rem]",
        "[--chart-1:oklch(0.35_0_0)] [--chart-2:oklch(0.45_0_0)] [--chart-3:oklch(0.55_0_0)] [--chart-4:oklch(0.65_0_0)] [--chart-5:oklch(0.75_0_0)]",
        "dark:[--chart-1:oklch(0.88_0_0)] dark:[--chart-2:oklch(0.80_0_0)] dark:[--chart-3:oklch(0.72_0_0)] dark:[--chart-4:oklch(0.64_0_0)] dark:[--chart-5:oklch(0.56_0_0)]",
        "[&_*]:!shadow-none [&_*]:!drop-shadow-none",
        className
      )}
    >
      <header
        data-route-screen-search-ignore="true"
        className={cn(
          "sticky top-0 z-30 w-full overflow-hidden border-b border-black/10 bg-background lg:rounded-t-[var(--route-screen-shell-radius)] lg:rounded-b-none dark:border-white/10",
          headerClassName
        )}
      >
        <div
          className={cn(
            "bg-white px-4 py-2 dark:bg-black",
            !useTitleOnlyMobileHeader && "space-y-0.5"
          )}
        >
          {useTitleOnlyMobileHeader ? (
            <div className="flex min-w-0 items-center gap-3">
              <h1
                className={cn(
                  "min-w-0 flex-1 truncate text-2xl leading-tight font-semibold tracking-tight text-[color-mix(in_oklch,var(--ui-accent-current)_72%,black)] dark:text-[color-mix(in_oklch,var(--ui-accent-current)_82%,white)]",
                  titleClassName
                )}
              >
                {title}
              </h1>
              <RouteScreenHeaderActions settingsContent={headerActions} />
            </div>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                {(sectionLabel || subSectionLabel) ? (
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
            </>
          )}
        </div>
      </header>

      <section
        data-slot="route-screen-body"
        className={cn(
          "flex min-h-0 flex-1 [--route-screen-body-inset:0.5rem] px-[var(--route-screen-body-inset)] py-[var(--route-screen-body-inset)] sm:[--route-screen-body-inset:0.75rem]",
          !showBodySurface && "pb-[calc(var(--route-screen-body-inset)+env(safe-area-inset-bottom)+5.25rem)]",
          !showBodySurface && "flex-col space-y-5",
          !showBodySurface && bodyClassName
        )}
      >
        {showBodySurface ? (
          <div
            data-slot="route-screen-body-surface"
            className={cn(
              "flex flex-1 flex-col rounded-t-[var(--route-screen-shell-radius)] rounded-b-[var(--route-screen-shell-radius)] border border-border/80 bg-card/35 p-3 backdrop-blur-[1px] sm:p-4 lg:p-5",
              "space-y-5",
              bodyClassName
            )}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </section>

      {isLoading ? (
        <div
          aria-live="polite"
          aria-busy="true"
          className="absolute inset-0 z-40 flex items-center justify-center bg-background/55 backdrop-blur-[2px]"
        >
          <div className="inline-flex flex-col items-center gap-3 rounded-2xl bg-background/80 px-6 py-5 shadow-sm">
            <div className="relative grid place-items-center">
              <span
                aria-hidden
                className="absolute size-16 rounded-full bg-[color-mix(in_oklch,var(--ui-accent-current)_24%,transparent)] blur-[8px] animate-pulse"
              />
              <span className="block size-12 rounded-full border-[3px] border-[color-mix(in_oklch,var(--ui-accent-current)_26%,transparent)] border-t-[var(--ui-accent-current)] animate-spin" />
            </div>
            <p className="text-sm font-semibold tracking-wide text-[color-mix(in_oklch,var(--ui-accent-current)_72%,black)] dark:text-[color-mix(in_oklch,var(--ui-accent-current)_82%,white)]">
              {dictionary.common.loading}
            </p>
            <div aria-hidden className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[var(--ui-accent-current)] animate-bounce [animation-delay:-0.24s]" />
              <span className="size-1.5 rounded-full bg-[var(--ui-accent-current)] animate-bounce [animation-delay:-0.12s]" />
              <span className="size-1.5 rounded-full bg-[var(--ui-accent-current)] animate-bounce" />
            </div>
          </div>
          <span className="sr-only">{dictionary.common.loading}</span>
        </div>
      ) : null}
    </div>
  )
}
