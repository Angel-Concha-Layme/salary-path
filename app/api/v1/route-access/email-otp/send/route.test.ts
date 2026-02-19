import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/app/lib/server/api-error"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/security/route-email-otp.domain", () => ({
  sendRouteEmailOtpForUser: vi.fn(),
}))

import { sendRouteEmailOtpForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"
import { POST } from "@/app/api/v1/route-access/email-otp/send/route"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedSendRouteEmailOtpForUser = vi.mocked(sendRouteEmailOtpForUser)

describe("POST /api/v1/route-access/email-otp/send", () => {
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
    mockedSendRouteEmailOtpForUser.mockResolvedValue({
      routeKey: "comparison",
      challengeExpiresAt: "2026-02-20T01:00:00.000Z",
      resendAvailableAt: "2026-02-19T20:01:00.000Z",
      remainingSends24h: 2,
    })

    const response = await POST(
      new Request("http://localhost/api/v1/route-access/email-otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ routeKey: "comparison" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      data: {
        routeKey: "comparison",
        challengeExpiresAt: "2026-02-20T01:00:00.000Z",
        resendAvailableAt: "2026-02-19T20:01:00.000Z",
        remainingSends24h: 2,
      },
    })
  })

  it("returns 400 for invalid payload", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedSendRouteEmailOtpForUser.mockReset()

    const response = await POST(
      new Request("http://localhost/api/v1/route-access/email-otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error.code).toBe("BAD_REQUEST")
  })

  it("returns 429 for daily limit", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedSendRouteEmailOtpForUser.mockRejectedValue(
      new ApiError(429, "ROUTE_OTP_DAILY_LIMIT", "Daily verification email limit reached")
    )

    const response = await POST(
      new Request("http://localhost/api/v1/route-access/email-otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ routeKey: "comparison" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(429)
    expect(payload.success).toBe(false)
    expect(payload.error.code).toBe("ROUTE_OTP_DAILY_LIMIT")
  })
})
