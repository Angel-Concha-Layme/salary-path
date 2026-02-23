import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  applyUiThemeControlsStyleToElement,
  applyUiThemePresetToElement,
  coerceUiThemeControlsStyle,
  coerceUiThemePresetKey,
  DEFAULT_UI_THEME_CONTROLS_STYLE,
  DEFAULT_UI_THEME_PRESET_KEY,
  getUiThemeControlsStyleFromStorage,
  getUiThemePresetFromStorage,
  setUiThemeControlsStyleInStorage,
  setUiThemePresetInStorage,
  subscribeUiThemeControlsStyle,
  subscribeUiThemePreset,
  UI_THEME_CONTROLS_STYLE_STORAGE_KEY,
  uiThemePresetKeys,
  UI_THEME_CSS_VAR_DARK,
  UI_THEME_CSS_VAR_LIGHT,
  UI_THEME_STORAGE_KEY,
} from "@/app/lib/features/ui-theme-preset"

type MockStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  clear: () => void
}

type MockWindow = {
  localStorage: MockStorage
  addEventListener: (type: string, listener: (event: unknown) => void) => void
  removeEventListener: (type: string, listener: (event: unknown) => void) => void
  dispatchEvent: (event: { type: string }) => void
}

function createMockWindow(): MockWindow {
  const storage = new Map<string, string>()
  const listeners = new Map<string, Set<(event: unknown) => void>>()

  return {
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null
      },
      setItem(key, value) {
        storage.set(key, value)
      },
      clear() {
        storage.clear()
      },
    },
    addEventListener(type, listener) {
      const current = listeners.get(type) ?? new Set<(event: unknown) => void>()
      current.add(listener)
      listeners.set(type, current)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    dispatchEvent(event) {
      listeners.get(event.type)?.forEach((listener) => listener(event))
    },
  }
}

function createMockElement() {
  const styleValues = new Map<string, string>()
  const attributes = new Map<string, string>()

  return {
    style: {
      setProperty(name: string, value: string) {
        styleValues.set(name, value)
      },
      getPropertyValue(name: string) {
        return styleValues.get(name) ?? ""
      },
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value)
    },
    getAttribute(name: string) {
      return attributes.get(name) ?? null
    },
  }
}

describe("ui theme preset feature", () => {
  beforeEach(() => {
    const mockWindow = createMockWindow()

    vi.stubGlobal("window", mockWindow)
    vi.stubGlobal("CustomEvent", class MockCustomEvent {
      readonly type: string
      readonly detail: unknown

      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type
        this.detail = init?.detail
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("keeps an allowlisted preset catalog", () => {
    expect(uiThemePresetKeys).toHaveLength(12)
    expect(uiThemePresetKeys).toContain("lagoon")
    expect(uiThemePresetKeys).toContain("scarlet")
    expect(uiThemePresetKeys).toContain("orchid")
  })

  it("coerces unknown values to the default preset", () => {
    expect(coerceUiThemePresetKey("lagoon")).toBe("lagoon")
    expect(coerceUiThemePresetKey("unknown-preset")).toBe(DEFAULT_UI_THEME_PRESET_KEY)
  })

  it("coerces unknown controls style to the default mode", () => {
    expect(coerceUiThemeControlsStyle("accent")).toBe("accent")
    expect(coerceUiThemeControlsStyle("legacy")).toBe("legacy")
    expect(coerceUiThemeControlsStyle("unknown-style")).toBe(DEFAULT_UI_THEME_CONTROLS_STYLE)
  })

  it("applies css variables on a target element", () => {
    const mockElement = createMockElement()
    const resolved = applyUiThemePresetToElement("cobalt", mockElement as unknown as HTMLElement)

    expect(resolved).toBe("cobalt")
    expect(mockElement.style.getPropertyValue(UI_THEME_CSS_VAR_LIGHT)).toBe("oklch(0.57 0.12 250)")
    expect(mockElement.style.getPropertyValue(UI_THEME_CSS_VAR_DARK)).toBe("oklch(0.75 0.14 252)")
    expect(mockElement.getAttribute("data-ui-theme-preset")).toBe("cobalt")
  })

  it("applies controls style as a root attribute", () => {
    const mockElement = createMockElement()
    const resolved = applyUiThemeControlsStyleToElement(
      "legacy",
      mockElement as unknown as HTMLElement
    )

    expect(resolved).toBe("legacy")
    expect(mockElement.getAttribute("data-ui-controls-style")).toBe("legacy")
  })

  it("reads and writes localStorage with fallback for invalid values", () => {
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, "invalid")
    expect(getUiThemePresetFromStorage()).toBe(DEFAULT_UI_THEME_PRESET_KEY)

    setUiThemePresetInStorage("atlas")
    expect(getUiThemePresetFromStorage()).toBe("atlas")
  })

  it("reads and writes controls style in localStorage", () => {
    window.localStorage.setItem(UI_THEME_CONTROLS_STYLE_STORAGE_KEY, "invalid")
    expect(getUiThemeControlsStyleFromStorage()).toBe(DEFAULT_UI_THEME_CONTROLS_STYLE)

    setUiThemeControlsStyleInStorage("legacy")
    expect(getUiThemeControlsStyleFromStorage()).toBe("legacy")
  })

  it("notifies subscribers when preset changes", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeUiThemePreset(listener)

    setUiThemePresetInStorage("indigo")
    expect(listener).toHaveBeenCalledWith("indigo")

    unsubscribe()
  })

  it("notifies subscribers when controls style changes", () => {
    const listener = vi.fn()
    const unsubscribe = subscribeUiThemeControlsStyle(listener)

    setUiThemeControlsStyleInStorage("legacy")
    expect(listener).toHaveBeenCalledWith("legacy")

    unsubscribe()
  })
})
