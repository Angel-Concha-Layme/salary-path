"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { SettingsAppearancePanel } from "@/app/(protected-app)/settings/_components/settings-appearance-panel"
import { SettingsSidebarBehaviorPanel } from "@/app/(protected-app)/settings/_components/settings-sidebar-behavior-panel"
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

const LEGACY_PRIMARY_LIGHT = "oklch(0.145 0 0)"
const LEGACY_PRIMARY_DARK = "oklch(0.985 0 0)"

type ThemePalette = {
  accentLight: string
  accentDark: string
  controlsLight: string
  controlsDark: string
}

function resolveThemePalette(
  themePresetKey: UiThemePresetKey,
  controlsStyle: UiThemeControlsStyle
): ThemePalette {
  const preset = getUiThemePreset(themePresetKey)

  return {
    accentLight: preset.light,
    accentDark: preset.dark,
    controlsLight: controlsStyle === "accent" ? preset.light : LEGACY_PRIMARY_LIGHT,
    controlsDark: controlsStyle === "accent" ? preset.dark : LEGACY_PRIMARY_DARK,
  }
}

export function SettingsScreen() {
  const { dictionary } = useDictionary()

  const [appliedThemePresetKey, setAppliedThemePresetKey] = useState<UiThemePresetKey>(
    DEFAULT_UI_THEME_PRESET_KEY
  )
  const [appliedControlsStyle, setAppliedControlsStyle] = useState<UiThemeControlsStyle>(
    DEFAULT_UI_THEME_CONTROLS_STYLE
  )
  const [draftThemePresetKey, setDraftThemePresetKey] = useState<UiThemePresetKey>(
    DEFAULT_UI_THEME_PRESET_KEY
  )
  const [draftControlsStyle, setDraftControlsStyle] = useState<UiThemeControlsStyle>(
    DEFAULT_UI_THEME_CONTROLS_STYLE
  )

  const userUiThemeQuery = useUserUiThemeQuery()
  const updateUserUiThemeMutation = useUpdateUserUiThemeMutation()

  const [sidebarBehavior, setSidebarBehavior] = useState<SidebarGroupBehavior>(
    DEFAULT_SIDEBAR_GROUP_BEHAVIOR
  )

  const hasPendingChanges =
    draftThemePresetKey !== appliedThemePresetKey || draftControlsStyle !== appliedControlsStyle
  const hasPendingChangesRef = useRef(false)

  const draftPalette = useMemo(
    () => resolveThemePalette(draftThemePresetKey, draftControlsStyle),
    [draftThemePresetKey, draftControlsStyle]
  )

  useEffect(() => {
    hasPendingChangesRef.current = hasPendingChanges
  }, [hasPendingChanges])

  useEffect(() => {
    queueMicrotask(() => {
      setSidebarBehavior(getSidebarGroupBehaviorFromStorage())

      const storedThemePresetKey = getUiThemePresetFromStorage()
      const storedControlsStyle = getUiThemeControlsStyleFromStorage()

      setAppliedThemePresetKey(storedThemePresetKey)
      setAppliedControlsStyle(storedControlsStyle)
      setDraftThemePresetKey(storedThemePresetKey)
      setDraftControlsStyle(storedControlsStyle)

      applyUiThemePresetToElement(storedThemePresetKey)
      applyUiThemeControlsStyleToElement(storedControlsStyle)
    })

    const unsubscribeSidebarBehavior = subscribeSidebarGroupBehavior((nextBehavior) => {
      setSidebarBehavior(nextBehavior)
    })

    return () => {
      unsubscribeSidebarBehavior()
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

    queueMicrotask(() => {
      setAppliedThemePresetKey(resolvedThemePresetKey)
      setAppliedControlsStyle(resolvedControlsStyle)

      if (!hasPendingChangesRef.current) {
        setDraftThemePresetKey(resolvedThemePresetKey)
        setDraftControlsStyle(resolvedControlsStyle)
      }
    })
  }, [userUiThemeQuery.data?.controlsStyle, userUiThemeQuery.data?.themePresetKey])

  const handleSidebarBehaviorChange = (value: SidebarGroupBehavior) => {
    setSidebarGroupBehaviorInStorage(value)
  }

  const handleThemePresetSelect = (nextThemePresetKey: UiThemePresetKey) => {
    if (updateUserUiThemeMutation.isLoading || nextThemePresetKey === draftThemePresetKey) {
      return
    }

    setDraftThemePresetKey(nextThemePresetKey)
  }

  const handleControlsStyleSelect = (nextControlsStyle: UiThemeControlsStyle) => {
    if (updateUserUiThemeMutation.isLoading || nextControlsStyle === draftControlsStyle) {
      return
    }

    setDraftControlsStyle(nextControlsStyle)
  }

  const handleDiscardChanges = () => {
    if (!hasPendingChanges || updateUserUiThemeMutation.isLoading) {
      return
    }

    setDraftThemePresetKey(appliedThemePresetKey)
    setDraftControlsStyle(appliedControlsStyle)
  }

  const handleApplyChanges = () => {
    if (!hasPendingChanges || updateUserUiThemeMutation.isLoading) {
      return
    }

    const nextThemePresetKey = draftThemePresetKey
    const nextControlsStyle = draftControlsStyle
    const previousAppliedThemePresetKey = appliedThemePresetKey
    const previousAppliedControlsStyle = appliedControlsStyle

    setAppliedThemePresetKey(nextThemePresetKey)
    setAppliedControlsStyle(nextControlsStyle)
    applyUiThemePresetToElement(nextThemePresetKey)
    applyUiThemeControlsStyleToElement(nextControlsStyle)
    setUiThemePresetInStorage(nextThemePresetKey)
    setUiThemeControlsStyleInStorage(nextControlsStyle)

    updateUserUiThemeMutation.mutate(
      {
        themePresetKey: nextThemePresetKey,
        controlsStyle: nextControlsStyle,
      },
      {
        onSuccess(result) {
          const persistedThemePresetKey = coerceUiThemePresetKey(result.themePresetKey)
          const persistedControlsStyle = coerceUiThemeControlsStyle(result.controlsStyle)

          setAppliedThemePresetKey(persistedThemePresetKey)
          setAppliedControlsStyle(persistedControlsStyle)
          setDraftThemePresetKey(persistedThemePresetKey)
          setDraftControlsStyle(persistedControlsStyle)

          applyUiThemePresetToElement(persistedThemePresetKey)
          applyUiThemeControlsStyleToElement(persistedControlsStyle)
          setUiThemePresetInStorage(persistedThemePresetKey)
          setUiThemeControlsStyleInStorage(persistedControlsStyle)
          toast.success(dictionary.settingsPage.appearance.toasts.saved)
        },
        onError() {
          setAppliedThemePresetKey(previousAppliedThemePresetKey)
          setAppliedControlsStyle(previousAppliedControlsStyle)
          applyUiThemePresetToElement(previousAppliedThemePresetKey)
          applyUiThemeControlsStyleToElement(previousAppliedControlsStyle)
          setUiThemePresetInStorage(previousAppliedThemePresetKey)
          setUiThemeControlsStyleInStorage(previousAppliedControlsStyle)
          toast.error(dictionary.settingsPage.appearance.toasts.error)
        },
      }
    )
  }

  return (
    <RouteScreen title={dictionary.settingsPage.title} subtitle={dictionary.settingsPage.subtitle}>
      <div className="space-y-8">
        <SettingsAppearancePanel
          appearance={dictionary.settingsPage.appearance}
          draftThemePresetKey={draftThemePresetKey}
          appliedThemePresetKey={appliedThemePresetKey}
          draftControlsStyle={draftControlsStyle}
          hasPendingChanges={hasPendingChanges}
          accentLight={draftPalette.accentLight}
          accentDark={draftPalette.accentDark}
          controlsLight={draftPalette.controlsLight}
          controlsDark={draftPalette.controlsDark}
          isSaving={updateUserUiThemeMutation.isLoading}
          onThemePresetSelect={handleThemePresetSelect}
          onControlsStyleSelect={handleControlsStyleSelect}
          onDiscardChanges={handleDiscardChanges}
          onApplyChanges={handleApplyChanges}
        />
        <SettingsSidebarBehaviorPanel
          sidebar={dictionary.settingsPage.sidebar}
          sidebarBehavior={sidebarBehavior}
          onSidebarBehaviorChange={handleSidebarBehaviorChange}
        />
      </div>
    </RouteScreen>
  )
}
