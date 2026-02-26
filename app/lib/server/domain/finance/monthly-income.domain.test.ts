import { describe, expect, it, vi } from "vitest"

import { PathCompanyEventType } from "@/app/lib/models/common/domain-enums"
import { buildDefaultWorkSchedule } from "@/app/lib/models/work-schedule/work-schedule.model"
import {
  calculateEmploymentEstimateForMonth,
  resolveRateAtDate,
} from "@/app/lib/server/domain/finance/monthly-income.domain"

vi.mock("@/app/lib/db/client", () => ({
  db: {},
}))

const defaultSchedule = buildDefaultWorkSchedule()

describe("monthly income domain date semantics", () => {
  it("applies the new rate from the event day (inclusive)", () => {
    const events = [
      {
        pathCompanyId: "company-1",
        eventType: PathCompanyEventType.START_RATE,
        effectiveDate: new Date("2025-02-01T00:00:00.000Z"),
        amount: 1000,
      },
      {
        pathCompanyId: "company-1",
        eventType: PathCompanyEventType.RATE_INCREASE,
        effectiveDate: new Date("2025-02-20T00:00:00.000Z"),
        amount: 1200,
      },
    ]

    expect(resolveRateAtDate(events, new Date("2025-02-19T00:00:00.000Z"))).toBe(1000)
    expect(resolveRateAtDate(events, new Date("2025-02-20T00:00:00.000Z"))).toBe(1200)
  })

  it("includes the increase day when prorating monthly compensation", () => {
    const amount = calculateEmploymentEstimateForMonth({
      company: {
        id: "company-1",
        displayName: "Acme",
        compensationType: "monthly",
        currency: "USD",
        startDate: new Date("2025-03-01T00:00:00.000Z"),
        endDate: null,
      },
      monthStart: new Date("2025-03-01T00:00:00.000Z"),
      monthEndExclusive: new Date("2025-04-01T00:00:00.000Z"),
      events: [
        {
          pathCompanyId: "company-1",
          eventType: PathCompanyEventType.START_RATE,
          effectiveDate: new Date("2025-03-01T00:00:00.000Z"),
          amount: 3100,
        },
        {
          pathCompanyId: "company-1",
          eventType: PathCompanyEventType.RATE_INCREASE,
          effectiveDate: new Date("2025-03-15T00:00:00.000Z"),
          amount: 6200,
        },
      ],
      schedule: defaultSchedule,
    })

    // 14 days at 3100 + 17 days at 6200 over a 31-day month.
    expect(amount).toBeCloseTo(4800, 8)
  })
})
