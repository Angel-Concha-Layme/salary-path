import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/onboarding/onboarding.domain", () => ({
  completeOnboarding: vi.fn(),
}))

import { POST } from "@/app/api/v1/onboarding/complete/route"
import { ApiError } from "@/app/lib/server/api-error"
import { completeOnboarding } from "@/app/lib/server/domain/onboarding/onboarding.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedCompleteOnboarding = vi.mocked(completeOnboarding)

describe("onboarding complete route", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("creates onboarding data with the new multi-company payload", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })

    mockedCompleteOnboarding.mockResolvedValue({
      completedAt: "2026-02-26T00:00:00.000Z",
      createdCompanies: [],
      createdEvents: [],
      settings: {
        id: "settings-1",
        ownerUserId: "user-1",
        currency: "USD",
        locale: "es",
        monthlyWorkHours: 173.3333,
        workDaysPerYear: 260,
        defaultWorkSchedule: [],
        createdAt: "2026-02-26T00:00:00.000Z",
        updatedAt: "2026-02-26T00:00:00.000Z",
        deletedAt: null,
      },
    })

    const payload = {
      locale: "es",
      defaultWorkSchedule: [],
      companies: [
        {
          companyName: "Current Co",
          roleName: "Engineer",
          startDate: "2025-02-01T00:00:00.000Z",
          compensationType: "monthly",
          currency: "USD",
          startRate: 3000,
          events: [],
        },
      ],
    }

    const response = await POST(
      new Request("http://localhost/api/v1/onboarding/complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    )

    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.success).toBe(true)
    expect(mockedCompleteOnboarding).toHaveBeenCalledWith("user-1", payload)
  })

  it("returns API errors from domain validation", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })

    mockedCompleteOnboarding.mockRejectedValue(
      new ApiError(400, "VALIDATION_ERROR", "current company must not have endDate")
    )

    const response = await POST(
      new Request("http://localhost/api/v1/onboarding/complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          locale: "es",
          defaultWorkSchedule: [],
          companies: [
            {
              companyName: "Current Co",
              roleName: "Engineer",
              startDate: "2025-02-01T00:00:00.000Z",
              endDate: "2025-03-01T00:00:00.000Z",
              compensationType: "monthly",
              currency: "USD",
              startRate: 3000,
              events: [],
            },
          ],
        }),
      })
    )

    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("VALIDATION_ERROR")
  })
})
