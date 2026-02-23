import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const rateStepFiles = [
  "components/onboarding/onboarding-wizard.tsx",
  "app/(protected-app)/career-path/companies/_components/create-company-dialog.tsx",
  "app/(protected-app)/career-path/companies/_components/create-event-dialog.tsx",
  "app/(protected-app)/career-path/companies/_components/event-details-form.tsx",
] as const

describe("rate step helper usage", () => {
  it("uses getCompensationRateStep in all rate forms", () => {
    for (const relativePath of rateStepFiles) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8")
      expect(source).toContain("getCompensationRateStep(")
    }
  })
})
