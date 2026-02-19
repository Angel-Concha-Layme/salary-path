import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/security/route-email-otp.domain", () => ({
  verifyRouteEmailOtpForUser: vi.fn(),
}))

import { verifyRouteEmailOtpForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"
import { POST } from "@/app/api/v1/route-access/email-otp/verify/route"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedVerifyRouteEmailOtpForUser = vi.mocked(verifyRouteEmailOtpForUser)

describe("POST /api/v1/route-access/email-otp/verify", () => {
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
    mockedVerifyRouteEmailOtpForUser.mockResolvedValue({
      routeKey: "comparison",
      verified: true,
      verificationExpiresAt: "2026-02-20T01:00:00.000Z",
    })

    const response = await POST(
      new Request("http://localhost/api/v1/route-access/email-otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ routeKey: "comparison", code: "123456" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      data: {
        routeKey: "comparison",
        verified: true,
        verificationExpiresAt: "2026-02-20T01:00:00.000Z",
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

    const response = await POST(
      new Request("http://localhost/api/v1/route-access/email-otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ routeKey: "comparison", code: "12" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error.code).toBe("BAD_REQUEST")
  })
})

