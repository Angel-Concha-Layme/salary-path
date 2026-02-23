"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useUpdateUserUiThemeMutation, useUserUiThemeQuery } from "@/app/hooks/settings/use-user-ui-theme"
import {
  applyUiThemeControlsStyleToElement,
  applyUiThemePresetToElement,
  coerceUiThemeControlsStyle,
  coerceUiThemePresetKey,
  DEFAULT_UI_THEME_CONTROLS_STYLE,
  DEFAULT_UI_THEME_PRESET_KEY,
  getUiThemeControlsStyleFromStorage,
  getUiThemePreset,
  getUiThemePresetFromStorage,
  setUiThemeControlsStyleInStorage,
  setUiThemePresetInStorage,
  subscribeUiThemeControlsStyle,
  subscribeUiThemePreset,
  uiThemePresetKeys,
  type UiThemeControlsStyle,
  type UiThemePresetKey,
} from "@/app/lib/features/ui-theme-preset"
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

type SettingsTabKey = "sidebar" | "appearance" | "platform"

function normalizeSettingsTab(value: string | null | undefined): SettingsTabKey {
  if (value === "appearance") {
    return "appearance"
  }

  return value === "platform" ? "platform" : "sidebar"
}

export function SettingsWorkspace() {
  const { dictionary } = useDictionary()
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("sidebar")
  const [selectedThemePresetKey, setSelectedThemePresetKey] = useState<UiThemePresetKey>(
    DEFAULT_UI_THEME_PRESET_KEY
  )
  const [selectedControlsStyle, setSelectedControlsStyle] = useState<UiThemeControlsStyle>(
    DEFAULT_UI_THEME_CONTROLS_STYLE
  )
  const userUiThemeQuery = useUserUiThemeQuery()
  const updateUserUiThemeMutation = useUpdateUserUiThemeMutation()

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
      const storedThemePresetKey = getUiThemePresetFromStorage()
      const storedControlsStyle = getUiThemeControlsStyleFromStorage()
      setSelectedThemePresetKey(storedThemePresetKey)
      setSelectedControlsStyle(storedControlsStyle)
      applyUiThemePresetToElement(storedThemePresetKey)
      applyUiThemeControlsStyleToElement(storedControlsStyle)
    })

    const unsubscribeSidebarBehavior = subscribeSidebarGroupBehavior((nextBehavior) => {
      setSidebarBehavior(nextBehavior)
    })

    const unsubscribeUiThemePreset = subscribeUiThemePreset((nextThemePresetKey) => {
      setSelectedThemePresetKey(nextThemePresetKey)
      applyUiThemePresetToElement(nextThemePresetKey)
    })

    const unsubscribeUiThemeControlsStyle = subscribeUiThemeControlsStyle((nextControlsStyle) => {
      setSelectedControlsStyle(nextControlsStyle)
      applyUiThemeControlsStyleToElement(nextControlsStyle)
    })

    return () => {
      unsubscribeSidebarBehavior()
      unsubscribeUiThemePreset()
      unsubscribeUiThemeControlsStyle()
    }
  }, [])

  useEffect(() => {
    const dbThemePresetKey = userUiThemeQuery.data?.themePresetKey
    const dbControlsStyle = userUiThemeQuery.data?.controlsStyle

    if (!dbThemePresetKey || !dbControlsStyle) {
      return
    }

    const resolvedThemePresetKey = coerceUiThemePresetKey(dbThemePresetKey)
    const resolvedControlsStyle = coerceUiThemeControlsStyle(dbControlsStyle)
    applyUiThemePresetToElement(resolvedThemePresetKey)
    applyUiThemeControlsStyleToElement(resolvedControlsStyle)

    if (getUiThemePresetFromStorage() !== resolvedThemePresetKey) {
      setUiThemePresetInStorage(resolvedThemePresetKey)
    }

    if (getUiThemeControlsStyleFromStorage() !== resolvedControlsStyle) {
      setUiThemeControlsStyleInStorage(resolvedControlsStyle)
    }
  }, [userUiThemeQuery.data?.controlsStyle, userUiThemeQuery.data?.themePresetKey])

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

  const handleThemePresetSelect = (nextThemePresetKey: UiThemePresetKey) => {
    if (
      updateUserUiThemeMutation.isLoading ||
      nextThemePresetKey === selectedThemePresetKey
    ) {
      return
    }

    const previousThemePresetKey = selectedThemePresetKey
    const previousControlsStyle = selectedControlsStyle
    setSelectedThemePresetKey(nextThemePresetKey)
    applyUiThemePresetToElement(nextThemePresetKey)
    setUiThemePresetInStorage(nextThemePresetKey)

    updateUserUiThemeMutation.mutate(
      {
        themePresetKey: nextThemePresetKey,
        controlsStyle: selectedControlsStyle,
      },
      {
        onSuccess(result) {
          const persistedThemePresetKey = coerceUiThemePresetKey(result.themePresetKey)
          const persistedControlsStyle = coerceUiThemeControlsStyle(result.controlsStyle)
          setSelectedThemePresetKey(persistedThemePresetKey)
          setSelectedControlsStyle(persistedControlsStyle)
          applyUiThemePresetToElement(persistedThemePresetKey)
          applyUiThemeControlsStyleToElement(persistedControlsStyle)
          setUiThemePresetInStorage(persistedThemePresetKey)
          setUiThemeControlsStyleInStorage(persistedControlsStyle)
          toast.success(dictionary.settingsPage.appearance.toasts.saved)
        },
        onError() {
          setSelectedThemePresetKey(previousThemePresetKey)
          setSelectedControlsStyle(previousControlsStyle)
          applyUiThemePresetToElement(previousThemePresetKey)
          applyUiThemeControlsStyleToElement(previousControlsStyle)
          setUiThemePresetInStorage(previousThemePresetKey)
          setUiThemeControlsStyleInStorage(previousControlsStyle)
          toast.error(dictionary.settingsPage.appearance.toasts.error)
        },
      }
    )
  }

  const handleControlsStyleSelect = (nextControlsStyle: UiThemeControlsStyle) => {
    if (
      updateUserUiThemeMutation.isLoading ||
      nextControlsStyle === selectedControlsStyle
    ) {
      return
    }

    const previousThemePresetKey = selectedThemePresetKey
    const previousControlsStyle = selectedControlsStyle
    setSelectedControlsStyle(nextControlsStyle)
    applyUiThemeControlsStyleToElement(nextControlsStyle)
    setUiThemeControlsStyleInStorage(nextControlsStyle)

    updateUserUiThemeMutation.mutate(
      {
        themePresetKey: selectedThemePresetKey,
        controlsStyle: nextControlsStyle,
      },
      {
        onSuccess(result) {
          const persistedThemePresetKey = coerceUiThemePresetKey(result.themePresetKey)
          const persistedControlsStyle = coerceUiThemeControlsStyle(result.controlsStyle)
          setSelectedThemePresetKey(persistedThemePresetKey)
          setSelectedControlsStyle(persistedControlsStyle)
          applyUiThemePresetToElement(persistedThemePresetKey)
          applyUiThemeControlsStyleToElement(persistedControlsStyle)
          setUiThemePresetInStorage(persistedThemePresetKey)
          setUiThemeControlsStyleInStorage(persistedControlsStyle)
          toast.success(dictionary.settingsPage.appearance.toasts.saved)
        },
        onError() {
          setSelectedThemePresetKey(previousThemePresetKey)
          setSelectedControlsStyle(previousControlsStyle)
          applyUiThemePresetToElement(previousThemePresetKey)
          applyUiThemeControlsStyleToElement(previousControlsStyle)
          setUiThemePresetInStorage(previousThemePresetKey)
          setUiThemeControlsStyleInStorage(previousControlsStyle)
          toast.error(dictionary.settingsPage.appearance.toasts.error)
        },
      }
    )
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
        <div className="grid gap-2 sm:grid-cols-3">
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
            variant={activeTab === "appearance" ? "default" : "outline"}
            className={cn(
              "h-auto justify-start px-3 py-2 text-left",
              activeTab === "appearance" && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => handleTabChange("appearance")}
          >
            {dictionary.settingsPage.tabs.appearance}
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

      {activeTab === "appearance" ? (
        <Card className="border border-border/80">
          <CardHeader>
            <CardTitle>{dictionary.settingsPage.appearance.title}</CardTitle>
            <CardDescription>{dictionary.settingsPage.appearance.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {dictionary.settingsPage.appearance.hint}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {dictionary.settingsPage.appearance.controls.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {dictionary.settingsPage.appearance.controls.description}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={selectedControlsStyle === "accent" ? "default" : "outline"}
                  className={cn(
                    "h-auto justify-start px-3 py-2 text-left",
                    selectedControlsStyle === "accent" &&
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => handleControlsStyleSelect("accent")}
                  disabled={updateUserUiThemeMutation.isLoading}
                >
                  {dictionary.settingsPage.appearance.controls.options.accent}
                </Button>
                <Button
                  type="button"
                  variant={selectedControlsStyle === "legacy" ? "default" : "outline"}
                  className={cn(
                    "h-auto justify-start px-3 py-2 text-left",
                    selectedControlsStyle === "legacy" &&
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => handleControlsStyleSelect("legacy")}
                  disabled={updateUserUiThemeMutation.isLoading}
                >
                  {dictionary.settingsPage.appearance.controls.options.legacy}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {uiThemePresetKeys.map((presetKey) => {
                const preset = getUiThemePreset(presetKey)
                const isActive = presetKey === selectedThemePresetKey

                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => handleThemePresetSelect(presetKey)}
                    disabled={updateUserUiThemeMutation.isLoading}
                    className={cn(
                      "rounded-lg border border-border/80 bg-card p-3 text-left transition-colors",
                      "hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60",
                      isActive && "ui-theme-sidebar-toggle-active"
                    )}
                    aria-pressed={isActive}
                  >
                    <span
                      className="mb-2 block h-10 w-full rounded-md border border-black/10 dark:border-white/10"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${preset.light} 0%, ${preset.light} 50%, ${preset.dark} 50%, ${preset.dark} 100%)`,
                      }}
                    />
                    <span className="block text-sm font-medium text-foreground">
                      {dictionary.settingsPage.appearance.presets[presetKey]}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {isActive
                        ? dictionary.settingsPage.appearance.selected
                        : dictionary.settingsPage.appearance.select}
                    </span>
                  </button>
                )
              })}
            </div>
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
