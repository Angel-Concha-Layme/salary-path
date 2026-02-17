import { relations, sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { user } from "@/app/lib/db/schema/auth"

const timestampNow = sql`(unixepoch() * 1000)`

export const currencyCatalog = sqliteTable(
  "currency_catalog",
  {
    code: text("code").primaryKey(),
    minorUnits: integer("minor_units").notNull().default(2),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
  },
  (table) => [
    check(
      "currency_catalog_minor_units_range",
      sql`${table.minorUnits} BETWEEN 0 AND 3`
    ),
  ]
)

export const userFinanceSettings = sqliteTable(
  "user_finance_settings",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    currency: text("currency").notNull().default("USD"),
    locale: text("locale").notNull().default("es"),
    monthlyWorkHours: integer("monthly_work_hours").notNull().default(174),
    workDaysPerYear: integer("work_days_per_year").notNull().default(261),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("user_finance_settings_owner_unique").on(table.ownerUserId),
    index("user_finance_settings_owner_deleted_idx").on(
      table.ownerUserId,
      table.deletedAt
    ),
    check(
      "user_finance_settings_monthly_work_hours_positive",
      sql`${table.monthlyWorkHours} > 0`
    ),
    check(
      "user_finance_settings_work_days_per_year_range",
      sql`${table.workDaysPerYear} BETWEEN 1 AND 366`
    ),
  ]
)

export const comparisonPersonas = sqliteTable(
  "comparison_personas",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("comparison_personas_owner_idx").on(table.ownerUserId),
    index("comparison_personas_owner_deleted_idx").on(
      table.ownerUserId,
      table.deletedAt
    ),
  ]
)

export const personaCareerEvents = sqliteTable(
  "persona_career_events",
  {
    id: text("id").primaryKey(),
    personaId: text("persona_id")
      .notNull()
      .references(() => comparisonPersonas.id, { onDelete: "cascade" }),
    eventDate: integer("event_date", { mode: "timestamp_ms" }).notNull(),
    title: text("title").notNull(),
    salaryAmount: real("salary_amount").notNull(),
    rateAmount: real("rate_amount"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("persona_career_events_persona_idx").on(table.personaId),
    index("persona_career_events_date_idx").on(table.eventDate),
    index("persona_career_events_deleted_idx").on(table.deletedAt),
    check("persona_career_events_salary_non_negative", sql`${table.salaryAmount} >= 0`),
    check(
      "persona_career_events_rate_non_negative",
      sql`${table.rateAmount} IS NULL OR ${table.rateAmount} >= 0`
    ),
  ]
)

export const personaBonusRules = sqliteTable(
  "persona_bonus_rules",
  {
    id: text("id").primaryKey(),
    personaId: text("persona_id")
      .notNull()
      .references(() => comparisonPersonas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    bonusType: text("bonus_type").notNull(),
    amount: real("amount").notNull(),
    startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("persona_bonus_rules_persona_idx").on(table.personaId),
    index("persona_bonus_rules_deleted_idx").on(table.deletedAt),
    check("persona_bonus_rules_amount_non_negative", sql`${table.amount} >= 0`),
    check(
      "persona_bonus_rules_date_consistency",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),
  ]
)

export const personaBonusRuleMonths = sqliteTable(
  "persona_bonus_rule_months",
  {
    id: text("id").primaryKey(),
    bonusRuleId: text("bonus_rule_id")
      .notNull()
      .references(() => personaBonusRules.id, { onDelete: "cascade" }),
    month: integer("month").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("persona_bonus_rule_months_rule_month_unique").on(
      table.bonusRuleId,
      table.month
    ),
    index("persona_bonus_rule_months_deleted_idx").on(table.deletedAt),
    check(
      "persona_bonus_rule_months_month_range",
      sql`${table.month} BETWEEN 1 AND 12`
    ),
  ]
)

export const companyCatalog = sqliteTable(
  "company_catalog",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull().default(""),
    slug: text("slug").notNull(),
    industry: text("industry"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("company_catalog_owner_slug_unique").on(table.ownerUserId, table.slug),
    uniqueIndex("company_catalog_slug_unique").on(table.slug),
    index("company_catalog_owner_idx").on(table.ownerUserId),
    index("company_catalog_name_normalized_deleted_idx").on(
      table.nameNormalized,
      table.deletedAt
    ),
    index("company_catalog_deleted_idx").on(table.deletedAt),
  ]
)

export const roleCatalog = sqliteTable(
  "role_catalog",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    slug: text("slug").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("role_catalog_slug_unique").on(table.slug),
    index("role_catalog_name_normalized_deleted_idx").on(
      table.nameNormalized,
      table.deletedAt
    ),
    index("role_catalog_deleted_idx").on(table.deletedAt),
  ]
)

export const pathCompanies = sqliteTable(
  "path_companies",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyCatalogId: text("company_catalog_id").references(() => companyCatalog.id, {
      onDelete: "set null",
    }),
    roleCatalogId: text("role_catalog_id").references(() => roleCatalog.id, {
      onDelete: "set null",
    }),
    color: text("color").notNull().default("#0F766E"),
    displayName: text("display_name").notNull(),
    roleDisplayName: text("role_display_name").notNull().default(""),
    compensationType: text("compensation_type").notNull().default("monthly"),
    currency: text("currency").notNull().default("USD"),
    score: integer("score").notNull().default(5),
    review: text("review").notNull().default(""),
    startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("path_companies_owner_idx").on(table.ownerUserId),
    index("path_companies_company_catalog_idx").on(table.companyCatalogId),
    index("path_companies_role_catalog_idx").on(table.roleCatalogId),
    index("path_companies_deleted_idx").on(table.deletedAt),
    check(
      "path_companies_compensation_type_check",
      sql`${table.compensationType} IN ('hourly', 'monthly')`
    ),
    check(
      "path_companies_date_consistency",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),
    check(
      "path_companies_score_range",
      sql`${table.score} BETWEEN 1 AND 10`
    ),
    check(
      "path_companies_review_length",
      sql`length(${table.review}) <= 1000`
    ),
    check(
      "path_companies_color_hex",
      sql`${table.color} GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'`
    ),
  ]
)

export const pathCompanyEvents = sqliteTable(
  "path_company_events",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pathCompanyId: text("path_company_id")
      .notNull()
      .references(() => pathCompanies.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    effectiveDate: integer("effective_date", { mode: "timestamp_ms" }).notNull(),
    amount: real("amount").notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("path_company_events_owner_idx").on(table.ownerUserId),
    index("path_company_events_path_company_idx").on(table.pathCompanyId),
    index("path_company_events_effective_date_idx").on(table.effectiveDate),
    index("path_company_events_deleted_idx").on(table.deletedAt),
    check("path_company_events_amount_non_negative", sql`${table.amount} >= 0`),
    check(
      "path_company_events_event_type_check",
      sql`${table.eventType} IN ('start_rate', 'rate_increase', 'annual_increase', 'mid_year_increase', 'promotion', 'end_of_employment')`
    ),
  ]
)

export const comparisonPersonasRelations = relations(comparisonPersonas, ({ many }) => ({
  careerEvents: many(personaCareerEvents),
  bonusRules: many(personaBonusRules),
}))

export const personaCareerEventsRelations = relations(personaCareerEvents, ({ one }) => ({
  persona: one(comparisonPersonas, {
    fields: [personaCareerEvents.personaId],
    references: [comparisonPersonas.id],
  }),
}))

export const personaBonusRulesRelations = relations(personaBonusRules, ({ one, many }) => ({
  persona: one(comparisonPersonas, {
    fields: [personaBonusRules.personaId],
    references: [comparisonPersonas.id],
  }),
  months: many(personaBonusRuleMonths),
}))

export const personaBonusRuleMonthsRelations = relations(
  personaBonusRuleMonths,
  ({ one }) => ({
    bonusRule: one(personaBonusRules, {
      fields: [personaBonusRuleMonths.bonusRuleId],
      references: [personaBonusRules.id],
    }),
  })
)

export const pathCompaniesRelations = relations(pathCompanies, ({ one, many }) => ({
  companyCatalog: one(companyCatalog, {
    fields: [pathCompanies.companyCatalogId],
    references: [companyCatalog.id],
  }),
  roleCatalog: one(roleCatalog, {
    fields: [pathCompanies.roleCatalogId],
    references: [roleCatalog.id],
  }),
  events: many(pathCompanyEvents),
}))

export const roleCatalogRelations = relations(roleCatalog, ({ many }) => ({
  pathCompanies: many(pathCompanies),
}))

export const pathCompanyEventsRelations = relations(pathCompanyEvents, ({ one }) => ({
  company: one(pathCompanies, {
    fields: [pathCompanyEvents.pathCompanyId],
    references: [pathCompanies.id],
  }),
}))
