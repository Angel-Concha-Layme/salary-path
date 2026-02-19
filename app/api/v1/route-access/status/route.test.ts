import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/security/route-email-otp.domain", () => ({
  getRouteAccessStatusForUser: vi.fn(),
}))

import { getRouteAccessStatusForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"
import { GET } from "@/app/api/v1/route-access/status/route"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedGetRouteAccessStatusForUser = vi.mocked(getRouteAccessStatusForUser)

describe("GET /api/v1/route-access/status", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("returns success envelope", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedGetRouteAccessStatusForUser.mockResolvedValue({
      routeKey: "comparison",
      required: true,
      verified: false,
      verificationExpiresAt: null,
      challengeActive: true,
      challengeExpiresAt: "2026-02-20T01:00:00.000Z",
      remainingSends24h: 2,
      resendAvailableAt: "2026-02-19T20:01:00.000Z",
    })

    const response = await GET(
      new Request("http://localhost/api/v1/route-access/status?routeKey=comparison")
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.routeKey).toBe("comparison")
    expect(payload.data.challengeActive).toBe(true)
  })

  it("returns 400 for invalid query params", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })

    const response = await GET(
      new Request("http://localhost/api/v1/route-access/status?routeKey=invalid-route")
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error.code).toBe("BAD_REQUEST")
  })
})

