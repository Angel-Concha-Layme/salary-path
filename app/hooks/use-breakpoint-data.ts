"use client"

import { useMemo, useSyncExternalStore } from "react"

import { BREAKPOINT_MIN_WIDTH, createBreakpointData, type BreakpointData } from "@/app/lib/features/breakpoints"

const DEFAULT_SERVER_VIEWPORT_WIDTH = BREAKPOINT_MIN_WIDTH.lg

function subscribeViewportSize(listener: () => void): () => void {
  window.addEventListener("resize", listener)
  window.addEventListener("orientationchange", listener)

  return () => {
    window.removeEventListener("resize", listener)
    window.removeEventListener("orientationchange", listener)
  }
}

function readViewportWidth(): number {
  return window.innerWidth
}

export function useBreakpointData(serverViewportWidth = DEFAULT_SERVER_VIEWPORT_WIDTH): BreakpointData {
  const viewportWidth = useSyncExternalStore(
    subscribeViewportSize,
    readViewportWidth,
    () => serverViewportWidth
  )

  return useMemo(() => createBreakpointData(viewportWidth), [viewportWidth])
}
