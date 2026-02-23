import type {
  UiThemeControlsStyle,
  UiThemePresetKey,
} from "@/app/lib/features/ui-theme-preset"

export interface UserUiThemeResponse {
  themePresetKey: UiThemePresetKey
  controlsStyle: UiThemeControlsStyle
  updatedAt: string
}

export interface UserUiThemeUpdateInput {
  themePresetKey: UiThemePresetKey
  controlsStyle: UiThemeControlsStyle
}
