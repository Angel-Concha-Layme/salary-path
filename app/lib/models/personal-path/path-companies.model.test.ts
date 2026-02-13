import { describe, expect, it } from "vitest"

import type {
  PathCompaniesCreateInput,
  PathCompaniesEntity,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"

describe("path companies model", () => {
  it("supports canonical company and role names in create input", () => {
    const input: PathCompaniesCreateInput = {
      companyName: "Acme",
      roleName: "Frontend Engineer",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: null,
      compensationType: "monthly",
      currency: "USD",
      score: 8,
      review: "Great learning environment.",
      color: "#0F766E",
    }

    expect(input.companyName).toBe("Acme")
    expect(input.roleName).toBe("Frontend Engineer")
    expect(input.color).toBe("#0F766E")
    expect(input.score).toBe(8)
    expect(input.review).toBe("Great learning environment.")
  })

  it("keeps compatibility fields available in create and update inputs", () => {
    const createInput: PathCompaniesCreateInput = {
      displayName: "Legacy Company",
      roleDisplayName: "Legacy Role",
      startDate: "2026-01-01T00:00:00.000Z",
    }

    const updateInput: PathCompaniesUpdateInput = {
      displayName: "Legacy Company 2",
      roleDisplayName: "Legacy Role 2",
    }

    expect(createInput.displayName).toBe("Legacy Company")
    expect(updateInput.roleDisplayName).toBe("Legacy Role 2")
  })

  it("requires color in entities", () => {
    const entity = {
      id: "company-1",
      ownerUserId: "user-1",
      companyCatalogId: null,
      roleCatalogId: null,
      color: "#1D4ED8",
      displayName: "Acme",
      roleDisplayName: "Engineer",
      compensationType: "monthly",
      currency: "USD",
      score: 7,
      review: "",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      deletedAt: null,
    } satisfies PathCompaniesEntity

    expect(entity.color).toBe("#1D4ED8")
  })
})
