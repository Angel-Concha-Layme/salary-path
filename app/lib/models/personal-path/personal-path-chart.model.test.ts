import { describe, expect, it } from "vitest"

import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import {
  buildPersonalPathCompanyTableRows,
  buildRateChartSeries,
  normalizeAmountToRateBasis,
  normalizeAmountToMonthly,
} from "@/app/lib/models/personal-path/personal-path-chart.model"

const companiesFixture: PathCompaniesEntity[] = [
  {
    id: "company-a",
    ownerUserId: "user-1",
    companyCatalogId: "catalog-a",
    roleCatalogId: "role-a",
    color: "#0F766E",
    displayName: "Northbyte",
    roleDisplayName: "Frontend Engineer",
    compensationType: "monthly",
    currency: "USD",
    score: 8,
    review: "Great team.",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
    workSchedule: null,
  },
  {
    id: "company-b",
    ownerUserId: "user-1",
    companyCatalogId: "catalog-b",
    roleCatalogId: "role-b",
    color: "#0369A1",
    displayName: "TerraCloud",
    roleDisplayName: "Engineer",
    compensationType: "hourly",
    currency: "USD",
    score: 7,
    review: "Strong mentoring.",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-01-31T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-02-01T00:00:00.000Z",
    deletedAt: null,
    workSchedule: null,
  },
  {
    id: "company-c",
    ownerUserId: "user-1",
    companyCatalogId: "catalog-c",
    roleCatalogId: "role-c",
    color: "#B45309",
    displayName: "EuroWorks",
    roleDisplayName: "Analyst",
    compensationType: "monthly",
    currency: "EUR",
    score: 9,
    review: "Great culture.",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
    workSchedule: null,
  },
]

const eventsFixture: PathCompanyEventsEntity[] = [
  {
    id: "event-a-1",
    pathCompanyId: "company-a",
    eventType: "start_rate",
    effectiveDate: "2024-01-01T00:00:00.000Z",
    amount: 3000,
    notes: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "event-a-2",
    pathCompanyId: "company-a",
    eventType: "promotion",
    effectiveDate: "2024-02-01T00:00:00.000Z",
    amount: 4000,
    notes: null,
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-01T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "event-b-1",
    pathCompanyId: "company-b",
    eventType: "start_rate",
    effectiveDate: "2024-01-01T00:00:00.000Z",
    amount: 10,
    notes: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "event-c-1",
    pathCompanyId: "company-c",
    eventType: "start_rate",
    effectiveDate: "2024-01-01T00:00:00.000Z",
    amount: 2500,
    notes: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    deletedAt: null,
  },
]

describe("personal path chart model", () => {
  it("builds rate series by company with event increases", () => {
    const result = buildRateChartSeries({
      companies: companiesFixture,
      events: eventsFixture,
      companyIds: ["company-a"],
      range: "all",
      rateBasis: "monthly",
      referenceDate: new Date("2024-03-01T00:00:00.000Z"),
    })

    expect(result).toHaveLength(2)

    const mainSeries = result.find((series) => series.id === "company-a")
    const continuationSeries = result.find((series) => series.id === "company-a--continuation")

    expect(mainSeries?.lineType).toBe("steps")
    expect(mainSeries?.points.map((point) => point.time)).toEqual([
      "2024-01-01",
      "2024-02-01",
    ])
    expect(mainSeries?.points[0]?.meta.type).toBe("rate")
    expect(mainSeries?.points[1]?.meta.type).toBe("rate")

    expect(continuationSeries?.showInLegend).toBe(false)
    expect(continuationSeries?.showInTooltip).toBe(false)
    expect(continuationSeries?.pointMarkersVisible).toBe(false)
    expect(continuationSeries?.points.map((point) => point.time)).toEqual([
      "2024-02-01",
      "2024-03-01",
    ])

    const secondPointMeta = mainSeries?.points[1]?.meta
    if (!secondPointMeta || secondPointMeta.type !== "rate") {
      throw new Error("Expected rate point metadata")
    }

    expect(secondPointMeta.increase).toBe(1000)
    expect(secondPointMeta.companyName).toBe("Northbyte")
  })

  it("calculates start_rate increase against the previous company when applicable", () => {
    const companies: PathCompaniesEntity[] = [
      {
        ...companiesFixture[0],
        id: "company-prev",
        displayName: "Prev Company",
        compensationType: "monthly",
      },
      {
        ...companiesFixture[1],
        id: "company-next",
        displayName: "Next Company",
        compensationType: "monthly",
        startDate: "2024-03-01T00:00:00.000Z",
        endDate: null,
      },
    ]

    const events: PathCompanyEventsEntity[] = [
      {
        ...eventsFixture[0],
        id: "event-prev-1",
        pathCompanyId: "company-prev",
        eventType: "start_rate",
        amount: 1200,
        effectiveDate: "2024-01-01T00:00:00.000Z",
      },
      {
        ...eventsFixture[0],
        id: "event-next-1",
        pathCompanyId: "company-next",
        eventType: "start_rate",
        amount: 1600,
        effectiveDate: "2024-03-01T00:00:00.000Z",
      },
    ]

    const result = buildRateChartSeries({
      companies,
      events,
      companyIds: ["company-next"],
      range: "all",
      rateBasis: "monthly",
      referenceDate: new Date("2024-03-15T00:00:00.000Z"),
    })

    const mainSeries = result.find((series) => series.id === "company-next")
    const startPointMeta = mainSeries?.points[0]?.meta

    if (!startPointMeta || startPointMeta.type !== "rate") {
      throw new Error("Expected rate point metadata")
    }

    expect(startPointMeta.eventType).toBe("start_rate")
    expect(startPointMeta.increase).toBe(400)
  })

  it("applies range filter and keeps continuity point", () => {
    const result = buildRateChartSeries({
      companies: companiesFixture,
      events: [
        {
          ...eventsFixture[0],
          id: "event-r-1",
          amount: 1000,
          effectiveDate: "2024-01-01T00:00:00.000Z",
        },
        {
          ...eventsFixture[0],
          id: "event-r-2",
          amount: 2000,
          effectiveDate: "2024-06-01T00:00:00.000Z",
        },
        {
          ...eventsFixture[0],
          id: "event-r-3",
          amount: 2200,
          effectiveDate: "2025-01-01T00:00:00.000Z",
        },
      ],
      companyIds: ["company-a"],
      range: "last12m",
      rateBasis: "monthly",
      referenceDate: new Date("2025-06-30T00:00:00.000Z"),
    })

    expect(result).toHaveLength(2)

    const mainSeries = result.find((series) => series.id === "company-a")
    const continuationSeries = result.find((series) => series.id === "company-a--continuation")

    expect(mainSeries?.points.map((point) => point.time)).toEqual([
      "2024-06-30",
      "2025-01-01",
    ])
    expect(mainSeries?.points[0]?.value).toBe(2000)
    expect(mainSeries?.points[1]?.value).toBe(2200)
    expect(continuationSeries?.points.map((point) => point.time)).toEqual([
      "2025-01-01",
      "2025-06-30",
    ])
    expect(continuationSeries?.points[1]?.value).toBe(2200)
  })

  it("uses end_of_employment to close the route without changing the current rate", () => {
    const result = buildRateChartSeries({
      companies: companiesFixture,
      events: [
        {
          ...eventsFixture[0],
          id: "event-end-1",
          amount: 1000,
          effectiveDate: "2024-01-01T00:00:00.000Z",
        },
        {
          ...eventsFixture[0],
          id: "event-end-2",
          eventType: "end_of_employment",
          amount: 1,
          effectiveDate: "2024-03-01T00:00:00.000Z",
        },
      ],
      companyIds: ["company-a"],
      range: "all",
      rateBasis: "monthly",
      referenceDate: new Date("2024-06-30T00:00:00.000Z"),
    })

    expect(result).toHaveLength(1)

    const mainSeries = result.find((series) => series.id === "company-a")
    const continuationSeries = result.find((series) => series.id === "company-a--continuation")

    expect(mainSeries?.points.map((point) => point.time)).toEqual([
      "2024-01-01",
      "2024-03-01",
    ])
    expect(mainSeries?.points.map((point) => point.value)).toEqual([1000, 1000])

    const endPointMeta = mainSeries?.points[1]?.meta
    if (!endPointMeta || endPointMeta.type !== "rate") {
      throw new Error("Expected rate point metadata")
    }

    expect(endPointMeta.eventType).toBe("end_of_employment")
    expect(endPointMeta.increase).toBe(0)
    expect(continuationSeries).toBeUndefined()
  })

  it("builds complete company rows with latest event summary", () => {
    const rows = buildPersonalPathCompanyTableRows(companiesFixture, eventsFixture)
    const firstRow = rows.find((row) => row.id === "company-a")
    const euroRow = rows.find((row) => row.id === "company-c")

    expect(firstRow?.eventCount).toBe(2)
    expect(firstRow?.latestEventType).toBe("promotion")
    expect(firstRow?.latestEventAmount).toBe(4000)
    expect(firstRow?.monthlyAverageSalary).toBe(4000)
    expect(firstRow?.annualSalary).toBe(48000)
    expect(euroRow?.latestEventType).toBe("start_rate")
    expect(euroRow?.monthlyAverageSalary).toBe(2500)
    expect(euroRow?.annualSalary).toBe(30000)
  })

  it("calculates monthly and annual salary using configured monthly work hours", () => {
    const rows = buildPersonalPathCompanyTableRows(companiesFixture, eventsFixture, 160)
    const hourlyRow = rows.find((row) => row.id === "company-b")

    expect(hourlyRow?.monthlyAverageSalary).toBe(1600)
    expect(hourlyRow?.annualSalary).toBe(19200)
  })

  it("normalizes hourly rate to monthly amount", () => {
    expect(normalizeAmountToMonthly(12, "hourly", 160)).toBe(1920)
    expect(normalizeAmountToMonthly(3000, "monthly", 160)).toBe(3000)
  })

  it("normalizes mixed compensation to selected rate basis", () => {
    expect(normalizeAmountToRateBasis(10, "hourly", "monthly", 160)).toBe(1600)
    expect(normalizeAmountToRateBasis(3200, "monthly", "hourly", 160)).toBe(20)
  })
})
