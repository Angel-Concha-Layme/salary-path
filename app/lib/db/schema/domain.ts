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
    uniqueIndex("user_finance_settings_owner_active_unique")
      .on(table.ownerUserId)
      .where(sql`${table.deletedAt} IS NULL`),
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

export const userWorkScheduleDays = sqliteTable(
  "user_work_schedule_days",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    isWorkingDay: integer("is_working_day").notNull().default(0),
    startMinute: integer("start_minute"),
    endMinute: integer("end_minute"),
    breakMinute: integer("break_minute"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("user_work_schedule_days_owner_day_active_unique")
      .on(table.ownerUserId, table.dayOfWeek)
      .where(sql`${table.deletedAt} IS NULL`),
    index("user_work_schedule_days_owner_deleted_idx").on(
      table.ownerUserId,
      table.deletedAt
    ),
    check(
      "user_work_schedule_days_day_of_week_range",
      sql`${table.dayOfWeek} BETWEEN 1 AND 7`
    ),
    check(
      "user_work_schedule_days_is_working_day_boolean",
      sql`${table.isWorkingDay} IN (0, 1)`
    ),
    check(
      "user_work_schedule_days_start_minute_range",
      sql`${table.startMinute} IS NULL OR ${table.startMinute} BETWEEN 0 AND 1440`
    ),
    check(
      "user_work_schedule_days_end_minute_range",
      sql`${table.endMinute} IS NULL OR ${table.endMinute} BETWEEN 0 AND 1440`
    ),
    check(
      "user_work_schedule_days_break_minute_range",
      sql`${table.breakMinute} IS NULL OR ${table.breakMinute} BETWEEN 0 AND 1440`
    ),
    check(
      "user_work_schedule_days_consistency",
      sql`(
        ${table.isWorkingDay} = 0
        AND ${table.startMinute} IS NULL
        AND ${table.endMinute} IS NULL
        AND ${table.breakMinute} IS NULL
      ) OR (
        ${table.isWorkingDay} = 1
        AND ${table.startMinute} IS NOT NULL
        AND ${table.endMinute} IS NOT NULL
        AND ${table.breakMinute} IS NOT NULL
        AND ${table.endMinute} > ${table.startMinute}
        AND ${table.breakMinute} < (${table.endMinute} - ${table.startMinute})
      )`
    ),
  ]
)

export const companyCatalog = sqliteTable(
  "company_catalog",
  {
    id: text("id").primaryKey(),
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
    uniqueIndex("company_catalog_slug_unique").on(table.slug),
    uniqueIndex("company_catalog_name_normalized_active_unique")
      .on(table.nameNormalized)
      .where(sql`${table.deletedAt} IS NULL`),
    index("company_catalog_name_normalized_deleted_idx").on(
      table.nameNormalized,
      table.deletedAt
    ),
    index("company_catalog_deleted_idx").on(table.deletedAt),
    index("company_catalog_deleted_created_idx").on(table.deletedAt, table.createdAt),
  ]
)

export const roleCatalog = sqliteTable(
  "role_catalog",
  {
    id: text("id").primaryKey(),
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
    uniqueIndex("role_catalog_name_normalized_active_unique")
      .on(table.nameNormalized)
      .where(sql`${table.deletedAt} IS NULL`),
    index("role_catalog_name_normalized_deleted_idx").on(
      table.nameNormalized,
      table.deletedAt
    ),
    index("role_catalog_deleted_idx").on(table.deletedAt),
    index("role_catalog_deleted_created_idx").on(table.deletedAt, table.createdAt),
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
    index("path_companies_owner_deleted_start_date_idx").on(
      table.ownerUserId,
      table.deletedAt,
      table.startDate
    ),
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
    index("path_company_events_path_company_idx").on(table.pathCompanyId),
    index("path_company_events_path_company_deleted_effective_idx").on(
      table.pathCompanyId,
      table.deletedAt,
      table.effectiveDate
    ),
    index("path_company_events_deleted_effective_idx").on(
      table.deletedAt,
      table.effectiveDate
    ),
    index("path_company_events_effective_date_idx").on(table.effectiveDate),
    index("path_company_events_deleted_idx").on(table.deletedAt),
    check("path_company_events_amount_non_negative", sql`${table.amount} >= 0`),
    check(
      "path_company_events_event_type_check",
      sql`${table.eventType} IN ('start_rate', 'rate_increase', 'annual_increase', 'mid_year_increase', 'promotion', 'end_of_employment')`
    ),
  ]
)

export const pathCompanyWorkScheduleDays = sqliteTable(
  "path_company_work_schedule_days",
  {
    id: text("id").primaryKey(),
    pathCompanyId: text("path_company_id")
      .notNull()
      .references(() => pathCompanies.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    isWorkingDay: integer("is_working_day").notNull().default(0),
    startMinute: integer("start_minute"),
    endMinute: integer("end_minute"),
    breakMinute: integer("break_minute"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("path_company_work_schedule_days_company_day_active_unique")
      .on(table.pathCompanyId, table.dayOfWeek)
      .where(sql`${table.deletedAt} IS NULL`),
    index("path_company_work_schedule_days_company_deleted_idx").on(
      table.pathCompanyId,
      table.deletedAt
    ),
    check(
      "path_company_work_schedule_days_day_of_week_range",
      sql`${table.dayOfWeek} BETWEEN 1 AND 7`
    ),
    check(
      "path_company_work_schedule_days_is_working_day_boolean",
      sql`${table.isWorkingDay} IN (0, 1)`
    ),
    check(
      "path_company_work_schedule_days_start_minute_range",
      sql`${table.startMinute} IS NULL OR ${table.startMinute} BETWEEN 0 AND 1440`
    ),
    check(
      "path_company_work_schedule_days_end_minute_range",
      sql`${table.endMinute} IS NULL OR ${table.endMinute} BETWEEN 0 AND 1440`
    ),
    check(
      "path_company_work_schedule_days_break_minute_range",
      sql`${table.breakMinute} IS NULL OR ${table.breakMinute} BETWEEN 0 AND 1440`
    ),
    check(
      "path_company_work_schedule_days_consistency",
      sql`(
        ${table.isWorkingDay} = 0
        AND ${table.startMinute} IS NULL
        AND ${table.endMinute} IS NULL
        AND ${table.breakMinute} IS NULL
      ) OR (
        ${table.isWorkingDay} = 1
        AND ${table.startMinute} IS NOT NULL
        AND ${table.endMinute} IS NOT NULL
        AND ${table.breakMinute} IS NOT NULL
        AND ${table.endMinute} > ${table.startMinute}
        AND ${table.breakMinute} < (${table.endMinute} - ${table.startMinute})
      )`
    ),
  ]
)

export const userMonthlyIncomeSources = sqliteTable(
  "user_monthly_income_sources",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    monthStart: integer("month_start", { mode: "timestamp_ms" }).notNull(),
    currency: text("currency").notNull().default("USD"),
    sourceType: text("source_type").notNull(),
    pathCompanyId: text("path_company_id").references(() => pathCompanies.id, {
      onDelete: "set null",
    }),
    companyNameSnapshot: text("company_name_snapshot"),
    computedAmount: real("computed_amount").notNull().default(0),
    finalAmount: real("final_amount").notNull().default(0),
    isUserEdited: integer("is_user_edited").notNull().default(0),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("user_monthly_income_sources_owner_deleted_month_idx").on(
      table.ownerUserId,
      table.deletedAt,
      table.monthStart
    ),
    index("user_monthly_income_sources_company_deleted_month_idx").on(
      table.pathCompanyId,
      table.deletedAt,
      table.monthStart
    ),
    check(
      "user_monthly_income_sources_source_type_check",
      sql`${table.sourceType} IN ('employment', 'bonus', 'extra_income', 'adjustment')`
    ),
    check(
      "user_monthly_income_sources_is_user_edited_boolean",
      sql`${table.isUserEdited} IN (0, 1)`
    ),
    check(
      "user_monthly_income_sources_employment_requires_company",
      sql`(${table.sourceType} != 'employment') OR (${table.pathCompanyId} IS NOT NULL)`
    ),
  ]
)

export const userMonthlyIncomeSnapshots = sqliteTable(
  "user_monthly_income_snapshots",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    monthStart: integer("month_start", { mode: "timestamp_ms" }).notNull(),
    currency: text("currency").notNull().default("USD"),
    employmentComputedTotal: real("employment_computed_total").notNull().default(0),
    employmentFinalTotal: real("employment_final_total").notNull().default(0),
    bonusTotal: real("bonus_total").notNull().default(0),
    extraIncomeTotal: real("extra_income_total").notNull().default(0),
    adjustmentTotal: real("adjustment_total").notNull().default(0),
    finalTotal: real("final_total").notNull().default(0),
    isAdjusted: integer("is_adjusted").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(timestampNow),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("user_monthly_income_snapshots_owner_month_currency_active_unique")
      .on(table.ownerUserId, table.monthStart, table.currency)
      .where(sql`${table.deletedAt} IS NULL`),
    index("user_monthly_income_snapshots_owner_deleted_month_idx").on(
      table.ownerUserId,
      table.deletedAt,
      table.monthStart
    ),
    check(
      "user_monthly_income_snapshots_is_adjusted_boolean",
      sql`${table.isAdjusted} IN (0, 1)`
    ),
  ]
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
  workScheduleDays: many(pathCompanyWorkScheduleDays),
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

export const userWorkScheduleDaysRelations = relations(userWorkScheduleDays, ({ one }) => ({
  owner: one(user, {
    fields: [userWorkScheduleDays.ownerUserId],
    references: [user.id],
  }),
}))

export const pathCompanyWorkScheduleDaysRelations = relations(
  pathCompanyWorkScheduleDays,
  ({ one }) => ({
    company: one(pathCompanies, {
      fields: [pathCompanyWorkScheduleDays.pathCompanyId],
      references: [pathCompanies.id],
    }),
  })
)

export const userMonthlyIncomeSourcesRelations = relations(
  userMonthlyIncomeSources,
  ({ one }) => ({
    owner: one(user, {
      fields: [userMonthlyIncomeSources.ownerUserId],
      references: [user.id],
    }),
    company: one(pathCompanies, {
      fields: [userMonthlyIncomeSources.pathCompanyId],
      references: [pathCompanies.id],
    }),
  })
)

export const userMonthlyIncomeSnapshotsRelations = relations(
  userMonthlyIncomeSnapshots,
  ({ one }) => ({
    owner: one(user, {
      fields: [userMonthlyIncomeSnapshots.ownerUserId],
      references: [user.id],
    }),
  })
)
