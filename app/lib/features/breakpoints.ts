export type ScreenSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
export type BreakpointKey = "sm" | "md" | "lg" | "xl" | "2xl"

export type ScreenLayoutProps<TState, TActions = Record<string, never>> = {
  breakpoint: BreakpointData
  state: TState
  actions: TActions
}

export type BreakpointData = {
  current: ScreenSize
  isMobile: boolean
  isDesktop: boolean
  up: (key: BreakpointKey) => boolean
  down: (key: BreakpointKey) => boolean
  between: (min: BreakpointKey, maxExclusive: BreakpointKey) => boolean
}

export const BREAKPOINT_MIN_WIDTH: Record<BreakpointKey, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export const SCREEN_MIN_WIDTH: Record<ScreenSize, number> = {
  xs: 0,
  sm: BREAKPOINT_MIN_WIDTH.sm,
  md: BREAKPOINT_MIN_WIDTH.md,
  lg: BREAKPOINT_MIN_WIDTH.lg,
  xl: BREAKPOINT_MIN_WIDTH.xl,
  "2xl": BREAKPOINT_MIN_WIDTH["2xl"],
}

const SCREEN_SIZE_ORDER: ScreenSize[] = ["2xl", "xl", "lg", "md", "sm", "xs"]

function normalizeViewportWidth(rawWidth: number): number {
  return Number.isFinite(rawWidth) && rawWidth >= 0 ? rawWidth : 0
}

function getMinWidth(key: BreakpointKey): number {
  return BREAKPOINT_MIN_WIDTH[key]
}

export function resolveScreenSize(rawWidth: number): ScreenSize {
  const width = normalizeViewportWidth(rawWidth)

  for (const size of SCREEN_SIZE_ORDER) {
    if (width >= SCREEN_MIN_WIDTH[size]) {
      return size
    }
  }

  return "xs"
}

export function isBreakpointUp(rawWidth: number, key: BreakpointKey): boolean {
  return normalizeViewportWidth(rawWidth) >= getMinWidth(key)
}

export function isBreakpointDown(rawWidth: number, key: BreakpointKey): boolean {
  return normalizeViewportWidth(rawWidth) < getMinWidth(key)
}

export function isBreakpointBetween(
  rawWidth: number,
  min: BreakpointKey,
  maxExclusive: BreakpointKey
): boolean {
  const width = normalizeViewportWidth(rawWidth)
  return width >= getMinWidth(min) && width < getMinWidth(maxExclusive)
}

export function createBreakpointData(rawWidth: number): BreakpointData {
  const width = normalizeViewportWidth(rawWidth)

  return {
    current: resolveScreenSize(width),
    isMobile: isBreakpointDown(width, "md"),
    isDesktop: isBreakpointUp(width, "md"),
    up: (key) => isBreakpointUp(width, key),
    down: (key) => isBreakpointDown(width, key),
    between: (min, maxExclusive) => isBreakpointBetween(width, min, maxExclusive),
  }
}
