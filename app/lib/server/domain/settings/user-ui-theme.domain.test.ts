import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  selectLimitMock,
  selectMock,
  updateReturningMock,
  updateSetMock,
  updateMock,
} = vi.hoisted(() => {
  const nextSelectLimitMock = vi.fn()
  const nextSelectWhereMock = vi.fn(() => ({
    limit: nextSelectLimitMock,
  }))
  const nextSelectFromMock = vi.fn(() => ({
    where: nextSelectWhereMock,
  }))
  const nextSelectMock = vi.fn(() => ({
    from: nextSelectFromMock,
  }))

  const nextUpdateReturningMock = vi.fn()
  const nextUpdateWhereMock = vi.fn(() => ({
    returning: nextUpdateReturningMock,
  }))
  const nextUpdateSetMock = vi.fn((payload: {
    uiThemePreset: string
    uiControlsStyle: "accent" | "legacy"
    updatedAt: Date
  }) => {
    void payload
    return {
      where: nextUpdateWhereMock,
    }
  })
  const nextUpdateMock = vi.fn(() => ({
    set: nextUpdateSetMock,
  }))

  return {
    selectLimitMock: nextSelectLimitMock,
    selectMock: nextSelectMock,
    updateReturningMock: nextUpdateReturningMock,
    updateSetMock: nextUpdateSetMock,
    updateMock: nextUpdateMock,
  }
})

vi.mock("@/app/lib/db/client", () => ({
  db: {
    select: selectMock,
    update: updateMock,
  },
}))

import {
  getUserUiTheme,
  updateUserUiTheme,
} from "@/app/lib/server/domain/settings/user-ui-theme.domain"

describe("user ui theme domain", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("rejects invalid preset key before writing to db", async () => {
    await expect(
      updateUserUiTheme("user-1", {
        themePresetKey: "invalid-preset",
        controlsStyle: "accent",
      } as never)
    ).rejects.toThrow()

    expect(updateMock).not.toHaveBeenCalled()
  })

  it("rejects invalid controls style before writing to db", async () => {
    await expect(
      updateUserUiTheme("user-1", {
        themePresetKey: "lagoon",
        controlsStyle: "invalid-style",
      } as never)
    ).rejects.toThrow()

    expect(updateMock).not.toHaveBeenCalled()
  })

  it("updates preset and persists updatedAt timestamp", async () => {
    updateReturningMock.mockResolvedValue([
      {
        uiThemePreset: "ocean",
        uiControlsStyle: "legacy",
        updatedAt: new Date("2026-02-23T02:00:00.000Z"),
      },
    ])

    const result = await updateUserUiTheme("user-1", {
      themePresetKey: "ocean",
      controlsStyle: "legacy",
    })

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(updateSetMock).toHaveBeenCalledTimes(1)
    const setPayload = updateSetMock.mock.calls[0]?.[0]

    expect(setPayload?.uiThemePreset).toBe("ocean")
    expect(setPayload?.uiControlsStyle).toBe("legacy")
    expect(setPayload?.updatedAt).toBeInstanceOf(Date)
    expect(result).toEqual({
      themePresetKey: "ocean",
      controlsStyle: "legacy",
      updatedAt: "2026-02-23T02:00:00.000Z",
    })
  })

  it("reads and coerces persisted theme key", async () => {
    selectLimitMock.mockResolvedValue([
      {
        uiThemePreset: "unknown-value",
        uiControlsStyle: "unknown-style",
        updatedAt: new Date("2026-02-23T03:00:00.000Z"),
      },
    ])

    const result = await getUserUiTheme("user-1")

    expect(selectMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      themePresetKey: "lagoon",
      controlsStyle: "accent",
      updatedAt: "2026-02-23T03:00:00.000Z",
    })
  })
})
