export const UI_THEME_STORAGE_KEY = "capital-path.ui-theme-preset"
export const UI_THEME_PRESET_EVENT = "capital-path:ui-theme-preset-changed"
export const UI_THEME_CONTROLS_STYLE_STORAGE_KEY = "capital-path.ui-controls-style"
export const UI_THEME_CONTROLS_STYLE_EVENT = "capital-path:ui-controls-style-changed"

export const UI_THEME_CSS_VAR_LIGHT = "--ui-accent-light"
export const UI_THEME_CSS_VAR_DARK = "--ui-accent-dark"
export const UI_THEME_CSS_VAR_CURRENT = "--ui-accent-current"

type UiThemePresetDefinition = {
  light: string
  dark: string
}

export const uiThemePresets = {
  lagoon: {
    light: "oklch(0.60 0.10 185)",
    dark: "oklch(0.78 0.13 182)",
  },
  arctic: {
    light: "oklch(0.64 0.08 220)",
    dark: "oklch(0.80 0.10 224)",
  },
  ocean: {
    light: "oklch(0.58 0.11 205)",
    dark: "oklch(0.76 0.13 208)",
  },
  atlas: {
    light: "oklch(0.62 0.09 170)",
    dark: "oklch(0.79 0.11 174)",
  },
  cobalt: {
    light: "oklch(0.57 0.12 250)",
    dark: "oklch(0.75 0.14 252)",
  },
  indigo: {
    light: "oklch(0.55 0.11 268)",
    dark: "oklch(0.73 0.13 270)",
  },
  steel: {
    light: "oklch(0.56 0.04 235)",
    dark: "oklch(0.74 0.05 236)",
  },
  slate: {
    light: "oklch(0.52 0.03 255)",
    dark: "oklch(0.70 0.04 256)",
  },
  ember: {
    light: "oklch(0.64 0.14 42)",
    dark: "oklch(0.79 0.12 44)",
  },
  scarlet: {
    light: "oklch(0.60 0.16 24)",
    dark: "oklch(0.76 0.14 26)",
  },
  rosewood: {
    light: "oklch(0.62 0.12 352)",
    dark: "oklch(0.78 0.10 352)",
  },
  orchid: {
    light: "oklch(0.63 0.13 326)",
    dark: "oklch(0.79 0.11 326)",
  },
} as const satisfies Record<string, UiThemePresetDefinition>

export type UiThemePresetKey = keyof typeof uiThemePresets

export const uiThemePresetKeys = Object.keys(uiThemePresets) as UiThemePresetKey[]

export const DEFAULT_UI_THEME_PRESET_KEY: UiThemePresetKey = "lagoon"

export const uiThemeControlsStyleValues = ["accent", "legacy"] as const
export type UiThemeControlsStyle = (typeof uiThemeControlsStyleValues)[number]
export const DEFAULT_UI_THEME_CONTROLS_STYLE: UiThemeControlsStyle = "accent"

export function isUiThemePresetKey(value: unknown): value is UiThemePresetKey {
  return typeof value === "string" && value in uiThemePresets
}

export function coerceUiThemePresetKey(
  value: unknown,
  fallback: UiThemePresetKey = DEFAULT_UI_THEME_PRESET_KEY
): UiThemePresetKey {
  return isUiThemePresetKey(value) ? value : fallback
}

export function isUiThemeControlsStyle(value: unknown): value is UiThemeControlsStyle {
  return (
    typeof value === "string" &&
    (uiThemeControlsStyleValues as readonly string[]).includes(value)
  )
}

export function coerceUiThemeControlsStyle(
  value: unknown,
  fallback: UiThemeControlsStyle = DEFAULT_UI_THEME_CONTROLS_STYLE
): UiThemeControlsStyle {
  return isUiThemeControlsStyle(value) ? value : fallback
}

export function getUiThemePreset(key: UiThemePresetKey): UiThemePresetDefinition {
  return uiThemePresets[key]
}

export function applyUiThemePresetToElement(
  key: unknown,
  element: HTMLElement = document.documentElement
): UiThemePresetKey {
  const resolvedKey = coerceUiThemePresetKey(key)
  const preset = getUiThemePreset(resolvedKey)

  element.style.setProperty(UI_THEME_CSS_VAR_LIGHT, preset.light)
  element.style.setProperty(UI_THEME_CSS_VAR_DARK, preset.dark)
  element.setAttribute("data-ui-theme-preset", resolvedKey)

  return resolvedKey
}

export function applyUiThemeControlsStyleToElement(
  value: unknown,
  element: HTMLElement = document.documentElement
): UiThemeControlsStyle {
  const resolved = coerceUiThemeControlsStyle(value)
  element.setAttribute("data-ui-controls-style", resolved)

  return resolved
}

export function getUiThemePresetFromStorage(): UiThemePresetKey {
  if (typeof window === "undefined") {
    return DEFAULT_UI_THEME_PRESET_KEY
  }

  try {
    return coerceUiThemePresetKey(window.localStorage.getItem(UI_THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_UI_THEME_PRESET_KEY
  }
}

export function setUiThemePresetInStorage(value: unknown): UiThemePresetKey {
  const resolvedKey = coerceUiThemePresetKey(value)

  if (typeof window === "undefined") {
    return resolvedKey
  }

  try {
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, resolvedKey)
  } catch {
    // Ignore blocked storage writes.
  }

  window.dispatchEvent(
    new CustomEvent<UiThemePresetKey>(UI_THEME_PRESET_EVENT, {
      detail: resolvedKey,
    })
  )

  return resolvedKey
}

export function getUiThemeControlsStyleFromStorage(): UiThemeControlsStyle {
  if (typeof window === "undefined") {
    return DEFAULT_UI_THEME_CONTROLS_STYLE
  }

  try {
    return coerceUiThemeControlsStyle(
      window.localStorage.getItem(UI_THEME_CONTROLS_STYLE_STORAGE_KEY)
    )
  } catch {
    return DEFAULT_UI_THEME_CONTROLS_STYLE
  }
}

export function setUiThemeControlsStyleInStorage(value: unknown): UiThemeControlsStyle {
  const resolved = coerceUiThemeControlsStyle(value)

  if (typeof window === "undefined") {
    return resolved
  }

  try {
    window.localStorage.setItem(UI_THEME_CONTROLS_STYLE_STORAGE_KEY, resolved)
  } catch {
    // Ignore blocked storage writes.
  }

  window.dispatchEvent(
    new CustomEvent<UiThemeControlsStyle>(UI_THEME_CONTROLS_STYLE_EVENT, {
      detail: resolved,
    })
  )

  return resolved
}

export function subscribeUiThemePreset(listener: (value: UiThemePresetKey) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const onThemeChange = (event: Event) => {
    const customEvent = event as CustomEvent<UiThemePresetKey>
    listener(coerceUiThemePresetKey(customEvent.detail))
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== UI_THEME_STORAGE_KEY) {
      return
    }

    listener(getUiThemePresetFromStorage())
  }

  window.addEventListener(UI_THEME_PRESET_EVENT, onThemeChange)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(UI_THEME_PRESET_EVENT, onThemeChange)
    window.removeEventListener("storage", onStorage)
  }
}

export function subscribeUiThemeControlsStyle(
  listener: (value: UiThemeControlsStyle) => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const onStyleChange = (event: Event) => {
    const customEvent = event as CustomEvent<UiThemeControlsStyle>
    listener(coerceUiThemeControlsStyle(customEvent.detail))
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== UI_THEME_CONTROLS_STYLE_STORAGE_KEY) {
      return
    }

    listener(getUiThemeControlsStyleFromStorage())
  }

  window.addEventListener(UI_THEME_CONTROLS_STYLE_EVENT, onStyleChange)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(UI_THEME_CONTROLS_STYLE_EVENT, onStyleChange)
    window.removeEventListener("storage", onStorage)
  }
}

export function createUiThemeBootstrapScript(): string {
  const serializedPresets = JSON.stringify(uiThemePresets)
  const defaultPresetKey = JSON.stringify(DEFAULT_UI_THEME_PRESET_KEY)
  const storageKey = JSON.stringify(UI_THEME_STORAGE_KEY)
  const controlsStyleValues = JSON.stringify(uiThemeControlsStyleValues)
  const controlsStyleFallback = JSON.stringify(DEFAULT_UI_THEME_CONTROLS_STYLE)
  const controlsStyleStorageKey = JSON.stringify(UI_THEME_CONTROLS_STYLE_STORAGE_KEY)
  const lightVar = JSON.stringify(UI_THEME_CSS_VAR_LIGHT)
  const darkVar = JSON.stringify(UI_THEME_CSS_VAR_DARK)

  return `(() => {
  const presets = ${serializedPresets};
  const fallback = ${defaultPresetKey};
  const storageKey = ${storageKey};
  const controlsStyleValues = ${controlsStyleValues};
  const controlsStyleFallback = ${controlsStyleFallback};
  const controlsStyleStorageKey = ${controlsStyleStorageKey};
  const lightVar = ${lightVar};
  const darkVar = ${darkVar};
  let key = fallback;
  let controlsStyle = controlsStyleFallback;

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && Object.prototype.hasOwnProperty.call(presets, stored)) {
      key = stored;
    }
  } catch {}

  try {
    const storedControlsStyle = window.localStorage.getItem(controlsStyleStorageKey);
    if (
      storedControlsStyle &&
      Array.isArray(controlsStyleValues) &&
      controlsStyleValues.includes(storedControlsStyle)
    ) {
      controlsStyle = storedControlsStyle;
    }
  } catch {}

  const preset = presets[key] ?? presets[fallback];
  if (!preset) {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty(lightVar, preset.light);
  root.style.setProperty(darkVar, preset.dark);
  root.setAttribute("data-ui-theme-preset", key);
  root.setAttribute("data-ui-controls-style", controlsStyle);
})();`
}
