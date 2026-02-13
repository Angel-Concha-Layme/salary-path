import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { SalaryProgressionPreviewChart } from "@/components/charts/salary-progression-preview-chart"

describe("SalaryProgressionPreviewChart", () => {
  it("renders preview labels without SSR errors", () => {
    const html = renderToStaticMarkup(
      <SalaryProgressionPreviewChart
        locale="en"
        salaryLabel="Salary"
        companyLabel="Company"
        eventTypeLabel="Event type"
        increaseLabel="Raise"
        periodLabel="2018-2026 · salary progression (USD)"
        dateLabel="Date"
      />
    )

    expect(html).toContain("2018-2026 · salary progression (USD)")
    expect(html).toContain("Salary")
    expect(html).toContain("Company")
  })
})

