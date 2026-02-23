import { describe, expect, it } from "vitest"

import {
  createBreakpointData,
  isBreakpointBetween,
  isBreakpointDown,
  isBreakpointUp,
  resolveScreenSize,
} from "@/app/lib/features/breakpoints"

describe("breakpoints", () => {
  const boundaryCases = [
    { width: 639, expected: "xs" },
    { width: 640, expected: "sm" },
    { width: 767, expected: "sm" },
    { width: 768, expected: "md" },
    { width: 1023, expected: "md" },
    { width: 1024, expected: "lg" },
    { width: 1279, expected: "lg" },
    { width: 1280, expected: "xl" },
    { width: 1535, expected: "xl" },
    { width: 1536, expected: "2xl" },
  ] as const

  it("resolves screen size on all breakpoint boundaries", () => {
    for (const testCase of boundaryCases) {
      expect(resolveScreenSize(testCase.width)).toBe(testCase.expected)
    }
  })

  it("builds semantic mobile and desktop flags", () => {
    expect(createBreakpointData(767).isMobile).toBe(true)
    expect(createBreakpointData(767).isDesktop).toBe(false)
    expect(createBreakpointData(768).isMobile).toBe(false)
    expect(createBreakpointData(768).isDesktop).toBe(true)
  })

  it("evaluates up and down helpers with exact boundaries", () => {
    expect(isBreakpointDown(1023, "lg")).toBe(true)
    expect(isBreakpointDown(1024, "lg")).toBe(false)
    expect(isBreakpointUp(1023, "lg")).toBe(false)
    expect(isBreakpointUp(1024, "lg")).toBe(true)
  })

  it("evaluates between helper with max bound excluded", () => {
    expect(isBreakpointBetween(768, "md", "lg")).toBe(true)
    expect(isBreakpointBetween(1023, "md", "lg")).toBe(true)
    expect(isBreakpointBetween(1024, "md", "lg")).toBe(false)
  })

  it("exposes helper functions on created breakpoint data", () => {
    const breakpoint = createBreakpointData(1280)

    expect(breakpoint.up("xl")).toBe(true)
    expect(breakpoint.down("2xl")).toBe(true)
    expect(breakpoint.between("lg", "2xl")).toBe(true)
    expect(breakpoint.between("2xl", "2xl")).toBe(false)
  })
})
