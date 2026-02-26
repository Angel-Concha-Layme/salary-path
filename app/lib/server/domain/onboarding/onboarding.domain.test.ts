import { beforeEach, describe, expect, it, vi } from "vitest"

import { buildDefaultWorkSchedule } from "@/app/lib/models/work-schedule/work-schedule.model"

const {
  recomputeMonthlyIncomeLedgerFromDateMock,
  replacePathCompanyWorkScheduleDaysMock,
  replaceUserWorkScheduleDaysMock,
  syncEndOfEmploymentEventMock,
  transactionMock,
  txInsertMock,
  txInsertReturningMock,
  txInsertValuesMock,
  txSelectLimitMock,
  txUpdateReturningMock,
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

  const nextInsertReturningMock = vi.fn()
  const nextInsertValuesMock = vi.fn((payload: unknown) => {
    void payload
    return {
      returning: nextInsertReturningMock,
    }
  })
  const nextInsertMock = vi.fn(() => ({
    values: nextInsertValuesMock,
  }))

  const nextUpdateReturningMock = vi.fn()
  const nextUpdateWhereMock = vi.fn(() => ({
    returning: nextUpdateReturningMock,
  }))
  const nextUpdateSetMock = vi.fn(() => ({
    where: nextUpdateWhereMock,
  }))
  const nextUpdateMock = vi.fn(() => ({
    set: nextUpdateSetMock,
  }))

  const tx = {
    select: nextSelectMock,
    insert: nextInsertMock,
    update: nextUpdateMock,
  }

  const nextTransactionMock = vi.fn(async (callback: (txParam: typeof tx) => unknown) => callback(tx))

  return {
    recomputeMonthlyIncomeLedgerFromDateMock: vi.fn(),
    replacePathCompanyWorkScheduleDaysMock: vi.fn(),
    replaceUserWorkScheduleDaysMock: vi.fn(),
    syncEndOfEmploymentEventMock: vi.fn(),
    transactionMock: nextTransactionMock,
    txInsertMock: nextInsertMock,
    txInsertReturningMock: nextInsertReturningMock,
    txInsertValuesMock: nextInsertValuesMock,
    txSelectLimitMock: nextSelectLimitMock,
    txUpdateReturningMock: nextUpdateReturningMock,
  }
})

vi.mock("@/app/lib/db/client", () => ({
  db: {
    transaction: transactionMock,
    select: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/app/lib/server/domain/finance/monthly-income.domain", () => ({
  recomputeMonthlyIncomeLedgerFromDate: recomputeMonthlyIncomeLedgerFromDateMock,
}))

vi.mock("@/app/lib/server/domain/finance/work-schedule.domain", () => ({
  replacePathCompanyWorkScheduleDays: replacePathCompanyWorkScheduleDaysMock,
  replaceUserWorkScheduleDays: replaceUserWorkScheduleDaysMock,
}))

vi.mock("@/app/lib/server/domain/personal-path/end-of-employment-event-sync", () => ({
  syncEndOfEmploymentEvent: syncEndOfEmploymentEventMock,
}))

import { completeOnboarding } from "@/app/lib/server/domain/onboarding/onboarding.domain"

describe("onboarding domain", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("rejects payloads with zero starting compensation", async () => {
    const schedule = buildDefaultWorkSchedule()

    await expect(
      completeOnboarding("user-1", {
        defaultWorkSchedule: schedule,
        companies: [
          {
            companyName: "Atlas",
            roleName: "Engineer",
            startDate: "2025-02-01T00:00:00.000Z",
            compensationType: "monthly",
            currency: "USD",
            startRate: 0,
            events: [],
          },
        ],
        locale: "es",
      })
    ).rejects.toBeTruthy()

    expect(transactionMock).not.toHaveBeenCalled()
  })

  it("rejects payloads that mark current company as ended", async () => {
    const schedule = buildDefaultWorkSchedule()

    await expect(
      completeOnboarding("user-1", {
        defaultWorkSchedule: schedule,
        companies: [
          {
            companyName: "Atlas",
            roleName: "Engineer",
            startDate: "2025-02-01T00:00:00.000Z",
            endDate: "2025-08-01T00:00:00.000Z",
            compensationType: "monthly",
            currency: "USD",
            startRate: 3000,
            events: [],
          },
        ],
        locale: "es",
      })
    ).rejects.toBeTruthy()

    expect(transactionMock).not.toHaveBeenCalled()
  })

  it("creates only start and provided events without auto rate increase", async () => {
    const schedule = buildDefaultWorkSchedule()
    const now = new Date("2026-02-26T00:00:00.000Z")

    txSelectLimitMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    txInsertReturningMock
      .mockResolvedValueOnce([
        {
          id: "company-catalog-1",
          name: "Atlas",
          nameNormalized: "atlas",
          slug: "atlas",
          industry: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "role-catalog-1",
          name: "Engineer",
          nameNormalized: "engineer",
          slug: "engineer",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "path-company-1",
          ownerUserId: "user-1",
          companyCatalogId: "company-catalog-1",
          roleCatalogId: "role-catalog-1",
          color: "#0F766E",
          displayName: "Atlas",
          roleDisplayName: "Engineer",
          compensationType: "monthly",
          currency: "USD",
          score: 5,
          review: "",
          startDate: new Date("2025-02-01T00:00:00.000Z"),
          endDate: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "event-start-1",
          pathCompanyId: "path-company-1",
          eventType: "start_rate",
          effectiveDate: new Date("2025-02-01T00:00:00.000Z"),
          amount: 3000,
          notes: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "event-annual-1",
          pathCompanyId: "path-company-1",
          eventType: "annual_increase",
          effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
          amount: 3500,
          notes: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "settings-1",
          ownerUserId: "user-1",
          currency: "USD",
          locale: "es",
          monthlyWorkHours: 173.3333,
          workDaysPerYear: 260,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])

    txUpdateReturningMock.mockResolvedValueOnce([
      {
        onboardingCompletedAt: now,
      },
    ])

    const result = await completeOnboarding("user-1", {
      defaultWorkSchedule: schedule,
      companies: [
        {
          companyName: "Atlas",
          roleName: "Engineer",
          startDate: "2025-02-01T00:00:00.000Z",
          compensationType: "monthly",
          currency: "USD",
          startRate: 3000,
          events: [
            {
              eventType: "annual_increase",
              effectiveDate: "2026-01-01T00:00:00.000Z",
              amount: 3500,
              notes: null,
            },
          ],
        },
      ],
      locale: "es",
    })

    const insertedEventPayloads = txInsertValuesMock.mock.calls
      .map((call) => call[0])
      .filter(
        (payload): payload is { eventType: string } =>
          typeof payload === "object" &&
          payload !== null &&
          "eventType" in payload &&
          typeof (payload as { eventType?: unknown }).eventType === "string"
      )

    expect(insertedEventPayloads.map((payload) => payload.eventType)).toEqual([
      "start_rate",
      "annual_increase",
    ])
    expect(insertedEventPayloads.some((payload) => payload.eventType === "rate_increase")).toBe(false)

    expect(syncEndOfEmploymentEventMock).not.toHaveBeenCalled()
    expect(replacePathCompanyWorkScheduleDaysMock).toHaveBeenCalledTimes(1)
    expect(replaceUserWorkScheduleDaysMock).toHaveBeenCalledTimes(1)
    expect(recomputeMonthlyIncomeLedgerFromDateMock).toHaveBeenCalledWith(
      "user-1",
      new Date("2025-02-01T00:00:00.000Z")
    )

    expect(result.createdCompanies).toHaveLength(1)
    expect(result.createdEvents).toHaveLength(2)
  })

  it("recomputes income from the earliest start date across all onboarding companies", async () => {
    const schedule = buildDefaultWorkSchedule()
    const now = new Date("2026-02-26T00:00:00.000Z")

    txSelectLimitMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    txInsertReturningMock
      .mockResolvedValueOnce([
        {
          id: "company-catalog-current",
          name: "Current Co",
          nameNormalized: "current co",
          slug: "current-co",
          industry: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "role-catalog-current",
          name: "Lead Engineer",
          nameNormalized: "lead engineer",
          slug: "lead-engineer",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "path-company-current",
          ownerUserId: "user-1",
          companyCatalogId: "company-catalog-current",
          roleCatalogId: "role-catalog-current",
          color: "#0F766E",
          displayName: "Current Co",
          roleDisplayName: "Lead Engineer",
          compensationType: "monthly",
          currency: "USD",
          score: 5,
          review: "",
          startDate: new Date("2024-06-01T00:00:00.000Z"),
          endDate: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "event-current-start",
          pathCompanyId: "path-company-current",
          eventType: "start_rate",
          effectiveDate: new Date("2024-06-01T00:00:00.000Z"),
          amount: 5000,
          notes: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "company-catalog-previous",
          name: "Previous Co",
          nameNormalized: "previous co",
          slug: "previous-co",
          industry: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "role-catalog-previous",
          name: "Engineer",
          nameNormalized: "engineer",
          slug: "engineer",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "path-company-previous",
          ownerUserId: "user-1",
          companyCatalogId: "company-catalog-previous",
          roleCatalogId: "role-catalog-previous",
          color: "#0F766E",
          displayName: "Previous Co",
          roleDisplayName: "Engineer",
          compensationType: "monthly",
          currency: "USD",
          score: 5,
          review: "",
          startDate: new Date("2020-01-01T00:00:00.000Z"),
          endDate: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "event-previous-start",
          pathCompanyId: "path-company-previous",
          eventType: "start_rate",
          effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
          amount: 3000,
          notes: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "settings-1",
          ownerUserId: "user-1",
          currency: "USD",
          locale: "es",
          monthlyWorkHours: 173.3333,
          workDaysPerYear: 260,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ])

    txUpdateReturningMock.mockResolvedValueOnce([
      {
        onboardingCompletedAt: now,
      },
    ])

    await completeOnboarding("user-1", {
      defaultWorkSchedule: schedule,
      companies: [
        {
          companyName: "Current Co",
          roleName: "Lead Engineer",
          startDate: "2024-06-01T00:00:00.000Z",
          compensationType: "monthly",
          currency: "USD",
          startRate: 5000,
          events: [],
        },
        {
          companyName: "Previous Co",
          roleName: "Engineer",
          startDate: "2020-01-01T00:00:00.000Z",
          compensationType: "monthly",
          currency: "USD",
          startRate: 3000,
          events: [],
          endDate: null,
        },
      ],
      locale: "es",
    })

    expect(txInsertMock).toHaveBeenCalled()
    expect(recomputeMonthlyIncomeLedgerFromDateMock).toHaveBeenCalledWith(
      "user-1",
      new Date("2020-01-01T00:00:00.000Z")
    )
  })
})
