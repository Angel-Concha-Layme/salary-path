import { describe, expect, it } from "vitest"

import { readOnboardingCompletedFromSession } from "@/app/lib/auth/session-onboarding"

describe("readOnboardingCompletedFromSession", () => {
  it("returns null when onboarding field is missing", () => {
    const result = readOnboardingCompletedFromSession({ user: {} })
    expect(result).toBeNull()
  })

  it("returns false for explicit null onboarding value", () => {
    const result = readOnboardingCompletedFromSession({
      user: {
        onboardingCompletedAt: null,
      },
    })

    expect(result).toBe(false)
  })

  it("returns true for valid onboarding date", () => {
    const result = readOnboardingCompletedFromSession({
      user: {
        onboardingCompletedAt: new Date("2026-02-24T10:00:00.000Z"),
      },
    })

    expect(result).toBe(true)
  })

  it("returns false for invalid onboarding date", () => {
    const result = readOnboardingCompletedFromSession({
      user: {
        onboardingCompletedAt: new Date("invalid"),
      },
    })

    expect(result).toBe(false)
  })
})
