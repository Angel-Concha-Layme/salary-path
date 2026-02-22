"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import {
  DEFAULT_SIDEBAR_GROUP_BEHAVIOR,
  getSidebarGroupBehaviorFromStorage,
  setSidebarGroupBehaviorInStorage,
  subscribeSidebarGroupBehavior,
  type SidebarGroupBehavior,
} from "@/app/lib/features/sidebar-group-behavior"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { RouteScreen } from "@/components/layout/route-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const SETTINGS_ACTIVE_TAB_STORAGE_KEY = "capital-path.settings.active-tab"

type SettingsTabKey = "sidebar" | "platform"

function normalizeSettingsTab(value: string | null | undefined): SettingsTabKey {
  return value === "platform" ? "platform" : "sidebar"
}

export function SettingsWorkspace() {
  const { dictionary } = useDictionary()
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("sidebar")

  const [sidebarBehavior, setSidebarBehavior] = useState<SidebarGroupBehavior>(
    DEFAULT_SIDEBAR_GROUP_BEHAVIOR
  )

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setActiveTab(normalizeSettingsTab(window.localStorage.getItem(SETTINGS_ACTIVE_TAB_STORAGE_KEY)))
      } catch {
        // Ignore blocked storage access.
      }

      setSidebarBehavior(getSidebarGroupBehaviorFromStorage())
    })

    return subscribeSidebarGroupBehavior((nextBehavior) => {
      setSidebarBehavior(nextBehavior)
    })
  }, [])

  const handleTabChange = (tab: SettingsTabKey) => {
    setActiveTab(tab)

    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(SETTINGS_ACTIVE_TAB_STORAGE_KEY, tab)
    } catch {
      // Ignore blocked storage writes.
    }
  }

  const handleSidebarBehaviorChange = (value: SidebarGroupBehavior) => {
    setSidebarGroupBehaviorInStorage(value)
  }

  return (
    <RouteScreen
      title={dictionary.settingsPage.title}
      subtitle={dictionary.settingsPage.subtitle}
    >
      <nav
        className="rounded-xl border border-border/80 bg-card p-2 shadow-sm"
        aria-label={dictionary.settingsPage.title}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={activeTab === "sidebar" ? "default" : "outline"}
            className={cn(
              "h-auto justify-start px-3 py-2 text-left",
              activeTab === "sidebar" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => handleTabChange("sidebar")}
          >
            {dictionary.settingsPage.tabs.sidebar}
          </Button>

          <Button
            type="button"
            variant={activeTab === "platform" ? "default" : "outline"}
            className={cn(
              "h-auto justify-start px-3 py-2 text-left",
              activeTab === "platform" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => handleTabChange("platform")}
          >
            {dictionary.settingsPage.tabs.platform}
          </Button>
        </div>
      </nav>

      {activeTab === "sidebar" ? (
        <Card className="border border-border/80">
          <CardHeader>
            <CardTitle>{dictionary.settingsPage.sidebar.title}</CardTitle>
            <CardDescription>{dictionary.settingsPage.sidebar.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={sidebarBehavior === "all_collapsed" ? "default" : "outline"}
                className={cn(
                  "h-auto justify-start px-3 py-2 text-left",
                  sidebarBehavior === "all_collapsed" &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => handleSidebarBehaviorChange("all_collapsed")}
              >
                {dictionary.settingsPage.sidebar.allCollapsed}
              </Button>

              <Button
                type="button"
                variant={sidebarBehavior === "all_expanded" ? "default" : "outline"}
                className={cn(
                  "h-auto justify-start px-3 py-2 text-left",
                  sidebarBehavior === "all_expanded" &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => handleSidebarBehaviorChange("all_expanded")}
              >
                {dictionary.settingsPage.sidebar.allExpanded}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {sidebarBehavior === "all_collapsed"
                ? dictionary.settingsPage.sidebar.collapsedHint
                : dictionary.settingsPage.sidebar.expandedHint}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "platform" ? (
        <Card className="border border-border/80">
          <CardHeader>
            <CardTitle>{dictionary.settingsPage.platform.title}</CardTitle>
            <CardDescription>{dictionary.settingsPage.platform.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/home">{dictionary.settingsPage.platform.goHome}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </RouteScreen>
  )
}
