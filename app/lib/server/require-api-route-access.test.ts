import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/app/lib/server/api-error"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/security/route-email-otp.domain", () => ({
  assertRouteAccessForUser: vi.fn(),
}))

import { assertRouteAccessForUser } from "@/app/lib/server/domain/security/route-email-otp.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"
import { requireApiRouteAccess } from "@/app/lib/server/require-api-route-access"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedAssertRouteAccessForUser = vi.mocked(assertRouteAccessForUser)

describe("requireApiRouteAccess", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("throws ROUTE_VERIFICATION_REQUIRED when no valid grant exists", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedAssertRouteAccessForUser.mockRejectedValue(
      new ApiError(
        403,
        "ROUTE_VERIFICATION_REQUIRED",
        "Route requires additional email verification"
      )
    )

    await expect(
      requireApiRouteAccess(new Request("http://localhost/api/v1/comparison/personas"), "comparison")
    ).rejects.toMatchObject({
      code: "ROUTE_VERIFICATION_REQUIRED",
      status: 403,
    })
  })

  it("returns session when grant is valid", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedAssertRouteAccessForUser.mockResolvedValue(undefined)

    const result = await requireApiRouteAccess(
      new Request("http://localhost/api/v1/comparison/personas"),
      "comparison"
    )

    expect(result.user.id).toBe("user-1")
    expect(mockedAssertRouteAccessForUser).toHaveBeenCalledWith("user-1", "comparison")
  })

  it("throws ROUTE_VERIFICATION_REQUIRED when grant is expired", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedAssertRouteAccessForUser.mockRejectedValue(
      new ApiError(
        403,
        "ROUTE_VERIFICATION_REQUIRED",
        "Route requires additional email verification"
      )
    )

    await expect(
      requireApiRouteAccess(new Request("http://localhost/api/v1/comparison/personas"), "comparison")
    ).rejects.toMatchObject({
      code: "ROUTE_VERIFICATION_REQUIRED",
      status: 403,
    })
  })
})

