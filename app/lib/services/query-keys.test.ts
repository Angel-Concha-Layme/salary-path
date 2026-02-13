import { describe, expect, it } from "vitest"

import { queryKeys } from "@/app/lib/services/query-keys"

describe("queryKeys", () => {
  it("builds me keys using stable shape", () => {
    expect(queryKeys.me.root()).toEqual(["me"])
    expect(queryKeys.me.detail()).toEqual(["me", "detail"])
  })

  it("builds admin users list keys with default limit", () => {
    expect(queryKeys.adminUsers.list()).toEqual(["admin", "users", "list", { limit: 50 }])
  })

  it("builds admin users list keys with explicit params", () => {
    expect(queryKeys.adminUsers.list({ limit: 25 })).toEqual([
      "admin",
      "users",
      "list",
      { limit: 25 },
    ])
  })

  it("exposes root keys for domain-level invalidation", () => {
    expect(queryKeys.settings.root()).toEqual(["settings"])
    expect(queryKeys.profile.root()).toEqual(["profile"])
    expect(queryKeys.companies.root()).toEqual(["companies"])
    expect(queryKeys.roles.root()).toEqual(["roles"])
    expect(queryKeys.onboarding.root()).toEqual(["onboarding"])
    expect(queryKeys.comparison.root()).toEqual(["comparison"])
    expect(queryKeys.personalPath.root()).toEqual(["personal-path"])
  })

  it("builds settings finance keys", () => {
    expect(queryKeys.settings.userFinanceSettings.list()).toEqual([
      "settings",
      "finance",
      "list",
      { limit: 50 },
    ])
    expect(queryKeys.settings.userFinanceSettings.detail("setting-1")).toEqual([
      "settings",
      "finance",
      "detail",
      "setting-1",
    ])
  })

  it("builds nested comparison keys", () => {
    expect(queryKeys.comparison.personas.careerEvents.list("persona-1")).toEqual([
      "comparison",
      "personas",
      "persona-1",
      "career-events",
      "list",
      { limit: 50 },
    ])
    expect(
      queryKeys.comparison.personas.bonusRules.months.detail(
        "persona-1",
        "rule-1",
        "month-1"
      )
    ).toEqual([
      "comparison",
      "personas",
      "persona-1",
      "bonus-rules",
      "rule-1",
      "months",
      "detail",
      "month-1",
    ])
  })

  it("builds nested personal path event keys", () => {
    expect(queryKeys.personalPath.companyEvents.list({ limit: 1000 })).toEqual([
      "personal-path",
      "company-events",
      "list",
      { limit: 1000 },
    ])
    expect(queryKeys.personalPath.companies.list({ limit: 25 })).toEqual([
      "personal-path",
      "companies",
      "list",
      { limit: 25 },
    ])
    expect(queryKeys.personalPath.companies.events.detail("company-1", "event-1")).toEqual([
      "personal-path",
      "companies",
      "company-1",
      "events",
      "detail",
      "event-1",
    ])
  })

  it("builds role catalog and onboarding keys", () => {
    expect(queryKeys.roles.roleCatalog.list({ search: "frontend", limit: 10 })).toEqual([
      "roles",
      "catalog",
      "list",
      { limit: 10, search: "frontend" },
    ])
    expect(queryKeys.roles.roleCatalog.detail("role-1")).toEqual([
      "roles",
      "catalog",
      "detail",
      "role-1",
    ])
    expect(queryKeys.onboarding.status()).toEqual(["onboarding", "status"])
  })
})
