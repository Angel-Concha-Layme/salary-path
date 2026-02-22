import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/app/lib/server/api-error"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/require-api-admin-session", () => ({
  requireApiAdminSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/roles/role-catalog.domain", () => ({
  getRoleCatalogById: vi.fn(),
  updateRoleCatalog: vi.fn(),
  deleteRoleCatalog: vi.fn(),
}))

import {
  deleteRoleCatalog,
  getRoleCatalogById,
  updateRoleCatalog,
} from "@/app/lib/server/domain/roles/role-catalog.domain"
import { requireApiAdminSession } from "@/app/lib/server/require-api-admin-session"
import { requireApiSession } from "@/app/lib/server/require-api-session"
import { DELETE, GET, PATCH } from "@/app/api/v1/roles/catalog/[roleId]/route"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedRequireApiAdminSession = vi.mocked(requireApiAdminSession)
const mockedGetRoleCatalogById = vi.mocked(getRoleCatalogById)
const mockedUpdateRoleCatalog = vi.mocked(updateRoleCatalog)
const mockedDeleteRoleCatalog = vi.mocked(deleteRoleCatalog)

function session(role: "user" | "admin" = "user") {
  return {
    source: "cookie" as const,
    user: {
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role,
    },
  }
}

describe("/api/v1/roles/catalog/[roleId]", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("allows GET for authenticated user", async () => {
    mockedRequireApiSession.mockResolvedValue(session("user"))
    mockedGetRoleCatalogById.mockResolvedValue({
      id: "role-1",
      name: "Engineer",
      nameNormalized: "engineer",
      slug: "engineer",
      createdAt: "2026-02-20T00:00:00.000Z",
      updatedAt: "2026-02-20T00:00:00.000Z",
      deletedAt: null,
    })

    const response = await GET(new Request("http://localhost/api/v1/roles/catalog/role-1"), {
      params: Promise.resolve({ roleId: "role-1" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockedGetRoleCatalogById).toHaveBeenCalledWith("role-1")
  })

  it("returns 403 for non-admin DELETE", async () => {
    mockedRequireApiAdminSession.mockRejectedValue(
      new ApiError(403, "FORBIDDEN", "Admin permissions required")
    )

    const response = await DELETE(
      new Request("http://localhost/api/v1/roles/catalog/role-1", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({ roleId: "role-1" }),
      }
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.success).toBe(false)
    expect(payload.error.code).toBe("FORBIDDEN")
    expect(mockedDeleteRoleCatalog).not.toHaveBeenCalled()
  })

  it("allows PATCH for admin", async () => {
    mockedRequireApiAdminSession.mockResolvedValue(session("admin"))
    mockedUpdateRoleCatalog.mockResolvedValue({
      id: "role-1",
      name: "Senior Engineer",
      nameNormalized: "senior engineer",
      slug: "senior-engineer",
      createdAt: "2026-02-20T00:00:00.000Z",
      updatedAt: "2026-02-20T01:00:00.000Z",
      deletedAt: null,
    })

    const response = await PATCH(
      new Request("http://localhost/api/v1/roles/catalog/role-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Senior Engineer" }),
      }),
      {
        params: Promise.resolve({ roleId: "role-1" }),
      }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockedUpdateRoleCatalog).toHaveBeenCalledWith("role-1", {
      name: "Senior Engineer",
    })
  })
})
