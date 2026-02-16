import { describe, expect, it } from "vitest"

import { pathCompanyEventTypeOptions } from "@/app/lib/models/personal-path/path-company-events.model"

describe("path company event types", () => {
  it("exposes the expected fixed event types", () => {
    expect(pathCompanyEventTypeOptions).toEqual([
      "start_rate",
      "rate_increase",
      "annual_increase",
      "mid_year_increase",
      "promotion",
      "end_of_employment",
    ])
  })
})
