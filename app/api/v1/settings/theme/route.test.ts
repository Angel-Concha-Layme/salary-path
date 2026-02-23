import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/settings/user-ui-theme.domain", () => ({
  getUserUiTheme: vi.fn(),
  updateUserUiTheme: vi.fn(),
}))

import { GET, PATCH } from "@/app/api/v1/settings/theme/route"
import { ApiError } from "@/app/lib/server/api-error"
import {
  getUserUiTheme,
  updateUserUiTheme,
} from "@/app/lib/server/domain/settings/user-ui-theme.domain"
import { requireApiSession } from "@/app/lib/server/require-api-session"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedGetUserUiTheme = vi.mocked(getUserUiTheme)
const mockedUpdateUserUiTheme = vi.mocked(updateUserUiTheme)

describe("settings theme route", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("GET returns the current user theme", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedGetUserUiTheme.mockResolvedValue({
      themePresetKey: "lagoon",
      controlsStyle: "accent",
      updatedAt: "2026-02-23T00:00:00.000Z",
    })

    const response = await GET(new Request("http://localhost/api/v1/settings/theme"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.themePresetKey).toBe("lagoon")
    expect(payload.data.controlsStyle).toBe("accent")
    expect(mockedGetUserUiTheme).toHaveBeenCalledWith("user-1")
  })

  it("PATCH updates the user theme", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedUpdateUserUiTheme.mockResolvedValue({
      themePresetKey: "ocean",
      controlsStyle: "legacy",
      updatedAt: "2026-02-23T00:00:00.000Z",
    })

    const response = await PATCH(
      new Request("http://localhost/api/v1/settings/theme", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ themePresetKey: "ocean", controlsStyle: "legacy" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.themePresetKey).toBe("ocean")
    expect(payload.data.controlsStyle).toBe("legacy")
    expect(mockedUpdateUserUiTheme).toHaveBeenCalledWith("user-1", {
      themePresetKey: "ocean",
      controlsStyle: "legacy",
    })
  })

  it("PATCH returns 400 for invalid payload from domain validation", async () => {
    mockedRequireApiSession.mockResolvedValue({
      source: "cookie",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "user",
      },
    })
    mockedUpdateUserUiTheme.mockRejectedValue(
      new ApiError(400, "BAD_REQUEST", "Invalid theme preset key")
    )

    const response = await PATCH(
      new Request("http://localhost/api/v1/settings/theme", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ themePresetKey: "lagoon", controlsStyle: "invalid-style" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error.code).toBe("BAD_REQUEST")
  })
})
