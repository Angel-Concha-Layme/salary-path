import { beforeEach, describe, expect, it, vi } from "vitest"

import { buildDefaultWorkSchedule } from "@/app/lib/models/work-schedule/work-schedule.model"

const {
  clearEndOfEmploymentEventsMock,
  clearPathCompanyWorkScheduleDaysMock,
  listPathCompanyWorkScheduleDaysMock,
  recomputeMonthlyIncomeLedgerFromDateMock,
  replacePathCompanyWorkScheduleDaysMock,
  selectLimitMock,
  selectMock,
  syncEndOfEmploymentEventMock,
  transactionMock,
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

  return {
    clearEndOfEmploymentEventsMock: vi.fn(),
    clearPathCompanyWorkScheduleDaysMock: vi.fn(),
    listPathCompanyWorkScheduleDaysMock: vi.fn(),
    recomputeMonthlyIncomeLedgerFromDateMock: vi.fn(),
    replacePathCompanyWorkScheduleDaysMock: vi.fn(),
    selectLimitMock: nextSelectLimitMock,
    selectMock: nextSelectMock,
    syncEndOfEmploymentEventMock: vi.fn(),
    transactionMock: vi.fn(),
  }
})

vi.mock("@/app/lib/db/client", () => ({
  db: {
    select: selectMock,
    transaction: transactionMock,
    update: vi.fn(),
  },
}))

vi.mock("@/app/lib/server/domain/finance/monthly-income.domain", () => ({
  recomputeMonthlyIncomeLedgerFromDate: recomputeMonthlyIncomeLedgerFromDateMock,
}))

vi.mock("@/app/lib/server/domain/finance/work-schedule.domain", () => ({
  clearPathCompanyWorkScheduleDays: clearPathCompanyWorkScheduleDaysMock,
  listPathCompanyWorkScheduleDays: listPathCompanyWorkScheduleDaysMock,
  replacePathCompanyWorkScheduleDays: replacePathCompanyWorkScheduleDaysMock,
  resolveUserWorkSchedule: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/personal-path/end-of-employment-event-sync", () => ({
  clearEndOfEmploymentEvents: clearEndOfEmploymentEventsMock,
  syncEndOfEmploymentEvent: syncEndOfEmploymentEventMock,
}))

vi.mock("@/app/lib/server/domain/companies/company-catalog.domain", () => ({
  resolveCompanyCatalogByName: vi.fn(),
}))

vi.mock("@/app/lib/server/domain/roles/role-catalog.domain", () => ({
  resolveRoleCatalogByName: vi.fn(),
}))

import { updatePathCompany } from "@/app/lib/server/domain/personal-path/path-companies.domain"

describe("path companies domain", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("skips processing when incoming work schedule is unchanged", async () => {
    const schedule = buildDefaultWorkSchedule()
    const currentRow = {
      id: "company-1",
      ownerUserId: "user-1",
      companyCatalogId: null,
      roleCatalogId: null,
      color: "#1D4ED8",
      displayName: "Acme",
      roleDisplayName: "Engineer",
      compensationType: "monthly",
      currency: "USD",
      score: 5,
      review: "",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-15T00:00:00.000Z"),
      deletedAt: null,
    }

    selectLimitMock.mockResolvedValue([currentRow])
    listPathCompanyWorkScheduleDaysMock.mockResolvedValue(new Map([["company-1", schedule]]))

    const result = await updatePathCompany("user-1", "company-1", {
      workSchedule: schedule,
    })

    expect(result.id).toBe("company-1")
    expect(result.workSchedule).toEqual(schedule)
    expect(transactionMock).not.toHaveBeenCalled()
    expect(recomputeMonthlyIncomeLedgerFromDateMock).not.toHaveBeenCalled()
    expect(replacePathCompanyWorkScheduleDaysMock).not.toHaveBeenCalled()
    expect(clearPathCompanyWorkScheduleDaysMock).not.toHaveBeenCalled()
  })
})
