import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "@/app/lib/server/api-error"

vi.mock("@/app/lib/server/require-api-session", () => ({
  requireApiSession: vi.fn(),
}))

vi.mock("@/app/lib/server/require-api-admin-session", () => ({
  requireApiAdminSession: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/companies/company-catalog.domain", () => ({
  getCompanyCatalogById: vi.fn(),
  updateCompanyCatalog: vi.fn(),
  deleteCompanyCatalog: vi.fn(),
}))

import {
  deleteCompanyCatalog,
  getCompanyCatalogById,
  updateCompanyCatalog,
} from "@/app/lib/server/domain/companies/company-catalog.domain"
import { requireApiAdminSession } from "@/app/lib/server/require-api-admin-session"
import { requireApiSession } from "@/app/lib/server/require-api-session"
import { DELETE, GET, PATCH } from "@/app/api/v1/companies/catalog/[companyId]/route"

const mockedRequireApiSession = vi.mocked(requireApiSession)
const mockedRequireApiAdminSession = vi.mocked(requireApiAdminSession)
const mockedGetCompanyCatalogById = vi.mocked(getCompanyCatalogById)
const mockedUpdateCompanyCatalog = vi.mocked(updateCompanyCatalog)
const mockedDeleteCompanyCatalog = vi.mocked(deleteCompanyCatalog)

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

describe("/api/v1/companies/catalog/[companyId]", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("allows GET for authenticated user", async () => {
    mockedRequireApiSession.mockResolvedValue(session("user"))
    mockedGetCompanyCatalogById.mockResolvedValue({
      id: "company-1",
      name: "Acme",
      nameNormalized: "acme",
      slug: "acme",
      industry: null,
      createdAt: "2026-02-20T00:00:00.000Z",
      updatedAt: "2026-02-20T00:00:00.000Z",
      deletedAt: null,
    })

    const response = await GET(new Request("http://localhost/api/v1/companies/catalog/company-1"), {
      params: Promise.resolve({ companyId: "company-1" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockedGetCompanyCatalogById).toHaveBeenCalledWith("company-1")
  })

  it("returns 403 for non-admin PATCH", async () => {
    mockedRequireApiAdminSession.mockRejectedValue(
      new ApiError(403, "FORBIDDEN", "Admin permissions required")
    )

    const response = await PATCH(
      new Request("http://localhost/api/v1/companies/catalog/company-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Acme Updated" }),
      }),
      {
        params: Promise.resolve({ companyId: "company-1" }),
      }
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.success).toBe(false)
    expect(payload.error.code).toBe("FORBIDDEN")
    expect(mockedUpdateCompanyCatalog).not.toHaveBeenCalled()
  })

  it("allows DELETE for admin", async () => {
    mockedRequireApiAdminSession.mockResolvedValue(session("admin"))
    mockedDeleteCompanyCatalog.mockResolvedValue({
      id: "company-1",
      deletedAt: "2026-02-20T00:00:00.000Z",
    })

    const response = await DELETE(
      new Request("http://localhost/api/v1/companies/catalog/company-1", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({ companyId: "company-1" }),
      }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockedDeleteCompanyCatalog).toHaveBeenCalledWith("company-1")
  })
})
