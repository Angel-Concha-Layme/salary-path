import type { Dictionary } from "@/app/lib/i18n/get-dictionary"
import {
  getUiThemePreset,
  uiThemePresetKeys,
  type UiThemeControlsStyle,
  type UiThemePresetKey,
} from "@/app/lib/features/ui-theme-preset"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SettingsAppearancePanelProps {
  appearance: Dictionary["settingsPage"]["appearance"]
  draftThemePresetKey: UiThemePresetKey
  appliedThemePresetKey: UiThemePresetKey
  draftControlsStyle: UiThemeControlsStyle
  hasPendingChanges: boolean
  accentLight: string
  accentDark: string
  controlsLight: string
  controlsDark: string
  isSaving: boolean
  onThemePresetSelect: (value: UiThemePresetKey) => void
  onControlsStyleSelect: (value: UiThemeControlsStyle) => void
  onDiscardChanges: () => void
  onApplyChanges: () => void
}

export function SettingsAppearancePanel({
  appearance,
  draftThemePresetKey,
  appliedThemePresetKey,
  draftControlsStyle,
  hasPendingChanges,
  accentLight,
  accentDark,
  controlsLight,
  controlsDark,
  isSaving,
  onThemePresetSelect,
  onControlsStyleSelect,
  onDiscardChanges,
  onApplyChanges,
}: SettingsAppearancePanelProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{appearance.title}</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.95fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {appearance.controls.title}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-auto justify-start px-3 py-2 text-left",
                  draftControlsStyle === "accent" && "text-foreground"
                )}
                style={
                  draftControlsStyle === "accent"
                    ? {
                        borderColor: controlsLight,
                        backgroundColor: `color-mix(in oklch, ${controlsLight} 14%, transparent)`,
                      }
                    : undefined
                }
                onClick={() => onControlsStyleSelect("accent")}
                disabled={isSaving}
                size="sm"
              >
                {appearance.controls.options.accent}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-auto justify-start px-3 py-2 text-left",
                  draftControlsStyle === "legacy" && "border-foreground/40 bg-muted/40 text-foreground"
                )}
                onClick={() => onControlsStyleSelect("legacy")}
                disabled={isSaving}
                size="sm"
              >
                {appearance.controls.options.legacy}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {appearance.accentTitle}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {uiThemePresetKeys.map((presetKey) => {
                const preset = getUiThemePreset(presetKey)
                const isSelected = presetKey === draftThemePresetKey

                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => onThemePresetSelect(presetKey)}
                    disabled={isSaving}
                    className={cn(
                      "rounded-lg border border-border/80 bg-card p-2.5 text-left transition-colors",
                      "hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60",
                      isSelected && "ring-1 ring-offset-1 ring-offset-background"
                    )}
                    style={
                      isSelected
                        ? {
                            borderColor: preset.light,
                            boxShadow: `0 0 0 1px color-mix(in oklch, ${preset.light} 35%, transparent)`,
                          }
                        : undefined
                    }
                    aria-pressed={isSelected}
                  >
                    <span
                      className="mb-1.5 block h-7 w-full rounded-md border border-black/10 dark:border-white/10"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${preset.light} 0%, ${preset.light} 50%, ${preset.dark} 50%, ${preset.dark} 100%)`,
                      }}
                    />
                    <span className="block text-xs font-medium text-foreground">
                      {appearance.presets[presetKey]}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {isSelected ? appearance.selected : appearance.select}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {hasPendingChanges ? appearance.actions.pending : appearance.actions.upToDate}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDiscardChanges}
                disabled={!hasPendingChanges || isSaving}
              >
                {appearance.actions.discard}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onApplyChanges}
                disabled={!hasPendingChanges || isSaving}
              >
                {isSaving ? appearance.actions.applying : appearance.actions.apply}
              </Button>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border bg-gradient-to-b from-background to-muted/35 p-3"
          style={{
            borderColor: `color-mix(in oklch, ${accentLight} 44%, var(--border))`,
            boxShadow: `0 0 0 1px color-mix(in oklch, ${accentLight} 12%, transparent)`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {appearance.preview.title}
            </p>
            <Badge
              variant="outline"
              style={{
                borderColor: `color-mix(in oklch, ${accentLight} 55%, transparent)`,
                backgroundColor: `color-mix(in oklch, ${accentLight} ${hasPendingChanges ? 24 : 14}%, transparent)`,
              }}
            >
              {hasPendingChanges ? appearance.actions.pending : appearance.actions.upToDate}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">
              {appearance.preview.currentState}: {appearance.presets[appliedThemePresetKey]}
            </Badge>
            <Badge variant="outline">
              {appearance.preview.draftState}: {appearance.presets[draftThemePresetKey]}
            </Badge>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border/80 bg-card px-2.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {appearance.preview.highlightTone}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="size-3 rounded-full border border-black/10 dark:border-white/15"
                  style={{ backgroundColor: accentLight }}
                />
                <span className="text-xs font-medium text-foreground">
                  {appearance.presets[draftThemePresetKey]}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-card px-2.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {appearance.preview.controlsTone}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="size-3 rounded-full border border-black/10 dark:border-white/15"
                  style={{ backgroundColor: controlsLight }}
                />
                <span className="text-xs font-medium text-foreground">
                  {draftControlsStyle === "accent"
                    ? appearance.controls.options.accent
                    : appearance.controls.options.legacy}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {appearance.preview.sampleTitle}
            </p>

            <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
              <div className="bg-white p-3">
                <p className="text-[11px] font-medium text-black/60">{appearance.preview.lightMode}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className="inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium"
                    style={{
                      backgroundColor: controlsLight,
                      color: "oklch(0.98 0.01 181)",
                    }}
                  >
                    {appearance.preview.primaryButton}
                  </span>
                  <span className="inline-flex h-7 items-center rounded-md border border-black/15 px-2.5 text-xs font-medium text-black/70">
                    {appearance.preview.outlineButton}
                  </span>
                  <span className="inline-flex h-7 items-center rounded-md bg-black/6 px-2.5 text-xs font-medium text-black/70">
                    {appearance.preview.secondaryButton}
                  </span>
                </div>
                <div className="mt-2 rounded-md border border-black/15 px-2.5 py-1.5 text-xs text-black/55">
                  {appearance.preview.inputField}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "62%",
                      backgroundColor: accentLight,
                    }}
                  />
                </div>
              </div>

              <div className="border-t border-white/20 bg-zinc-950 p-3">
                <p className="text-[11px] font-medium text-white/65">{appearance.preview.darkMode}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className="inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium"
                    style={{
                      backgroundColor: controlsDark,
                      color: draftControlsStyle === "legacy" ? "oklch(0.15 0 0)" : "oklch(0.98 0 0)",
                    }}
                  >
                    {appearance.preview.primaryButton}
                  </span>
                  <span className="inline-flex h-7 items-center rounded-md border border-white/20 px-2.5 text-xs font-medium text-white/75">
                    {appearance.preview.outlineButton}
                  </span>
                  <span className="inline-flex h-7 items-center rounded-md bg-white/8 px-2.5 text-xs font-medium text-white/75">
                    {appearance.preview.secondaryButton}
                  </span>
                </div>
                <div className="mt-2 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white/50">
                  {appearance.preview.inputField}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/12">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "62%",
                      backgroundColor: accentDark,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
