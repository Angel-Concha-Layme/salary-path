import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("migration 0007 currency enum enforcement", () => {
  const migrationPath = join(process.cwd(), "drizzle", "0007_currency_enum_enforcement.sql")
  const migrationSql = readFileSync(migrationPath, "utf8")

  it("creates currency catalog and backup tables", () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "currency_catalog"')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "path_companies_enum_backup"')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "user_finance_settings_currency_backup"')
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS "path_company_events_event_type_backup"')
  })

  it("enforces enum-like fields with triggers", () => {
    expect(migrationSql).toContain('CREATE TRIGGER IF NOT EXISTS "path_companies_compensation_type_insert_check"')
    expect(migrationSql).toContain('CREATE TRIGGER IF NOT EXISTS "path_companies_currency_insert_check"')
    expect(migrationSql).toContain('CREATE TRIGGER IF NOT EXISTS "user_finance_settings_currency_insert_check"')
    expect(migrationSql).toContain('CREATE TRIGGER IF NOT EXISTS "path_company_events_event_type_insert_check"')
  })

  it("includes fallback normalization for production data", () => {
    expect(migrationSql).toContain("ELSE 'monthly'")
    expect(migrationSql).toContain("ELSE 'USD'")
    expect(migrationSql).toContain("WHEN lower(trim(\"event_type\")) = 'annual' THEN 'annual_increase'")
    expect(migrationSql).toContain("ELSE 'rate_increase'")
  })
})
