import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import {
  companyCatalog,
  pathCompanies,
  pathCompanyEvents,
  roleCatalog,
  user,
  userFinanceSettings,
} from "@/app/lib/db/schema"
import {
  PathCompanyEventType,
  compensationTypeSchema,
  currencyCodeSchema,
  normalizeCompensationType,
  normalizeCurrencyCode,
  normalizePathCompanyEventType,
} from "@/app/lib/models/common/domain-enums"
import type {
  OnboardingCompleteInput,
  OnboardingCompleteResponse,
  OnboardingStatusResponse,
} from "@/app/lib/models/onboarding/onboarding.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { UserFinanceSettingsEntity } from "@/app/lib/models/settings/user-finance-settings.model"
import { getRandomCompanyColor } from "@/app/lib/models/personal-path/company-colors"
import {
  deriveLegacyWorkSettingsFromSchedule,
  workScheduleSchema,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { ApiError } from "@/app/lib/server/api-error"
import { normalizeSearchText, toIso, toSlug } from "@/app/lib/server/domain/common"
import { recomputeMonthlyIncomeLedgerFromDate } from "@/app/lib/server/domain/finance/monthly-income.domain"
import {
  replacePathCompanyWorkScheduleDays,
  replaceUserWorkScheduleDays,
} from "@/app/lib/server/domain/finance/work-schedule.domain"
import { syncEndOfEmploymentEvent } from "@/app/lib/server/domain/personal-path/end-of-employment-event-sync"

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

const onboardingEventTypeSchema = z.enum([
  PathCompanyEventType.RATE_INCREASE,
  PathCompanyEventType.ANNUAL_INCREASE,
  PathCompanyEventType.MID_YEAR_INCREASE,
  PathCompanyEventType.PROMOTION,
])

const companyEventSchema = z.object({
  eventType: onboardingEventTypeSchema,
  effectiveDate: z.coerce.date(),
  amount: z.number().min(0),
  notes: z.string().trim().max(1000).nullable().optional(),
})

const companySchema = z
  .object({
    companyName: z.string().trim().min(1).max(120),
    roleName: z.string().trim().min(1).max(120),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    compensationType: compensationTypeSchema,
    currency: currencyCodeSchema,
    startRate: z.number().gt(0),
    events: z.array(companyEventSchema),
    workSchedule: workScheduleSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endDate must be greater than or equal to startDate",
        path: ["endDate"],
      })
    }

    value.events.forEach((event, index) => {
      if (event.effectiveDate < value.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "event effectiveDate must be greater than or equal to startDate",
          path: ["events", index, "effectiveDate"],
        })
      }

      if (value.endDate && event.effectiveDate > value.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "event effectiveDate must be less than or equal to endDate",
          path: ["events", index, "effectiveDate"],
        })
      }
    })
  })

const completeSchema = z
  .object({
    companies: z.array(companySchema).min(1),
    defaultWorkSchedule: workScheduleSchema,
    locale: z.string().trim().min(2).max(20).optional(),
  })
  .superRefine((value, ctx) => {
    const currentCompany = value.companies[0]

    if (currentCompany?.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "current company must not have endDate",
        path: ["companies", 0, "endDate"],
      })
    }
  })

function mapPathCompanyEntity(
  row: typeof pathCompanies.$inferSelect,
  workSchedule: WorkSchedule | null = null
): PathCompaniesEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    companyCatalogId: row.companyCatalogId,
    roleCatalogId: row.roleCatalogId,
    color: row.color,
    displayName: row.displayName,
    roleDisplayName: row.roleDisplayName,
    compensationType: normalizeCompensationType(row.compensationType),
    currency: normalizeCurrencyCode(row.currency),
    score: row.score,
    review: row.review,
    startDate: toIso(row.startDate) ?? new Date(0).toISOString(),
    endDate: toIso(row.endDate),
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
    workSchedule,
  }
}

function mapPathCompanyEventEntity(
  row: typeof pathCompanyEvents.$inferSelect
): PathCompanyEventsEntity {
  return {
    id: row.id,
    pathCompanyId: row.pathCompanyId,
    eventType: normalizePathCompanyEventType(row.eventType),
    effectiveDate: toIso(row.effectiveDate) ?? new Date(0).toISOString(),
    amount: row.amount,
    notes: row.notes,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

function mapUserFinanceSettingsEntity(
  row: typeof userFinanceSettings.$inferSelect,
  defaultWorkSchedule: WorkSchedule
): UserFinanceSettingsEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    currency: normalizeCurrencyCode(row.currency),
    locale: row.locale,
    monthlyWorkHours: row.monthlyWorkHours,
    workDaysPerYear: row.workDaysPerYear,
    defaultWorkSchedule,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function resolveCompanyCatalog(
  tx: DbTx,
  companyName: string,
  now: Date
) {
  const normalizedName = normalizeSearchText(companyName)

  const existingByNameRows = await tx
    .select()
    .from(companyCatalog)
    .where(
      and(
        eq(companyCatalog.nameNormalized, normalizedName),
        isNull(companyCatalog.deletedAt)
      )
    )
    .limit(1)

  const existingByName = existingByNameRows[0]

  if (existingByName) {
    return existingByName
  }

  const slugBase = toSlug(companyName) || `company-${crypto.randomUUID().slice(0, 8)}`
  let slug = slugBase
  let suffix = 2

  while (true) {
    const rows = await tx
      .select()
      .from(companyCatalog)
      .where(and(eq(companyCatalog.slug, slug), isNull(companyCatalog.deletedAt)))
      .limit(1)

    const existingBySlug = rows[0]

    if (!existingBySlug) {
      break
    }

    if (existingBySlug.nameNormalized === normalizedName) {
      return existingBySlug
    }

    slug = `${slugBase}-${suffix}`
    suffix += 1
  }

  const insertedRows = await tx
    .insert(companyCatalog)
    .values({
      id: crypto.randomUUID(),
      name: companyName,
      nameNormalized: normalizedName,
      slug,
      industry: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const inserted = insertedRows[0]

  if (!inserted) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create company catalog")
  }

  return inserted
}

async function resolveRoleCatalog(
  tx: DbTx,
  roleName: string,
  now: Date
) {
  const normalizedName = normalizeSearchText(roleName)

  const existingByNameRows = await tx
    .select()
    .from(roleCatalog)
    .where(and(eq(roleCatalog.nameNormalized, normalizedName), isNull(roleCatalog.deletedAt)))
    .limit(1)

  const existingByName = existingByNameRows[0]

  if (existingByName) {
    return existingByName
  }

  const slugBase = toSlug(roleName) || `role-${crypto.randomUUID().slice(0, 8)}`
  let slug = slugBase
  let suffix = 2

  while (true) {
    const rows = await tx
      .select()
      .from(roleCatalog)
      .where(and(eq(roleCatalog.slug, slug), isNull(roleCatalog.deletedAt)))
      .limit(1)

    const existingBySlug = rows[0]

    if (!existingBySlug) {
      break
    }

    if (existingBySlug.nameNormalized === normalizedName) {
      return existingBySlug
    }

    slug = `${slugBase}-${suffix}`
    suffix += 1
  }

  const insertedRows = await tx
    .insert(roleCatalog)
    .values({
      id: crypto.randomUUID(),
      name: roleName,
      nameNormalized: normalizedName,
      slug,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const inserted = insertedRows[0]

  if (!inserted) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create role catalog")
  }

  return inserted
}

export async function getOnboardingStatus(ownerUserId: string): Promise<OnboardingStatusResponse> {
  const rows = await db
    .select({ onboardingCompletedAt: user.onboardingCompletedAt })
    .from(user)
    .where(eq(user.id, ownerUserId))
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "User not found")
  }

  const completedAt = toIso(row.onboardingCompletedAt)

  return {
    completed: Boolean(completedAt),
    completedAt,
  }
}

export async function completeOnboarding(
  ownerUserId: string,
  input: OnboardingCompleteInput
): Promise<OnboardingCompleteResponse> {
  const payload = completeSchema.parse(input)
  const defaultWorkSchedule = payload.defaultWorkSchedule
  const derivedWorkSettings = deriveLegacyWorkSettingsFromSchedule(defaultWorkSchedule)

  const earliestStartDate = payload.companies.reduce(
    (currentEarliest, company) =>
      company.startDate.getTime() < currentEarliest.getTime()
        ? company.startDate
        : currentEarliest,
    payload.companies[0].startDate
  )

  const result = await db.transaction(async (tx) => {
    const now = new Date()
    const createdCompanies: Array<{
      row: typeof pathCompanies.$inferSelect
      workSchedule: WorkSchedule
    }> = []
    const createdEvents: Array<typeof pathCompanyEvents.$inferSelect> = []

    for (const [index, companyInput] of payload.companies.entries()) {
      const company = await resolveCompanyCatalog(tx, companyInput.companyName, now)
      const role = await resolveRoleCatalog(tx, companyInput.roleName, now)
      const isCurrentCompany = index === 0
      const endDate = isCurrentCompany ? null : companyInput.endDate ?? null
      const companyWorkSchedule = isCurrentCompany
        ? defaultWorkSchedule
        : companyInput.workSchedule ?? defaultWorkSchedule

      const pathCompanyRows = await tx
        .insert(pathCompanies)
        .values({
          id: crypto.randomUUID(),
          ownerUserId,
          companyCatalogId: company.id,
          roleCatalogId: role.id,
          color: getRandomCompanyColor(),
          displayName: company.name,
          roleDisplayName: role.name,
          compensationType: companyInput.compensationType,
          currency: companyInput.currency,
          score: 5,
          review: "",
          startDate: companyInput.startDate,
          endDate,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      const pathCompany = pathCompanyRows[0]

      if (!pathCompany) {
        throw new ApiError(500, "INTERNAL_ERROR", "Failed to create path company")
      }

      await replacePathCompanyWorkScheduleDays(pathCompany.id, companyWorkSchedule, now, tx)

      const startEventRows = await tx
        .insert(pathCompanyEvents)
        .values({
          id: crypto.randomUUID(),
          pathCompanyId: pathCompany.id,
          eventType: PathCompanyEventType.START_RATE,
          effectiveDate: companyInput.startDate,
          amount: companyInput.startRate,
          notes: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      const startEvent = startEventRows[0]

      if (!startEvent) {
        throw new ApiError(500, "INTERNAL_ERROR", "Failed to create start rate event")
      }

      createdEvents.push(startEvent)

      for (const eventInput of companyInput.events) {
        const eventRows = await tx
          .insert(pathCompanyEvents)
          .values({
            id: crypto.randomUUID(),
            pathCompanyId: pathCompany.id,
            eventType: eventInput.eventType,
            effectiveDate: eventInput.effectiveDate,
            amount: eventInput.amount,
            notes: eventInput.notes ?? null,
            createdAt: now,
            updatedAt: now,
          })
          .returning()

        const event = eventRows[0]

        if (!event) {
          throw new ApiError(500, "INTERNAL_ERROR", "Failed to create path company event")
        }

        createdEvents.push(event)
      }

      if (endDate) {
        await syncEndOfEmploymentEvent(tx, {
          pathCompanyId: pathCompany.id,
          endDate,
          now,
        })

        const endEventRows = await tx
          .select()
          .from(pathCompanyEvents)
          .where(
            and(
              eq(pathCompanyEvents.pathCompanyId, pathCompany.id),
              eq(pathCompanyEvents.eventType, PathCompanyEventType.END_OF_EMPLOYMENT),
              isNull(pathCompanyEvents.deletedAt)
            )
          )
          .orderBy(
            desc(pathCompanyEvents.effectiveDate),
            desc(pathCompanyEvents.updatedAt),
            desc(pathCompanyEvents.createdAt),
            desc(pathCompanyEvents.id)
          )
          .limit(1)

        const endEvent = endEventRows[0]

        if (endEvent) {
          createdEvents.push(endEvent)
        }
      }

      createdCompanies.push({
        row: pathCompany,
        workSchedule: companyWorkSchedule,
      })
    }

    const existingSettingsRows = await tx
      .select()
      .from(userFinanceSettings)
      .where(
        and(
          eq(userFinanceSettings.ownerUserId, ownerUserId),
          isNull(userFinanceSettings.deletedAt)
        )
      )
      .limit(1)

    const existingSettings = existingSettingsRows[0]
    const settingsCurrency = payload.companies[0].currency

    let settingsRow: typeof userFinanceSettings.$inferSelect | undefined

    if (!existingSettings) {
      const insertedRows = await tx
        .insert(userFinanceSettings)
        .values({
          id: crypto.randomUUID(),
          ownerUserId,
          currency: settingsCurrency,
          locale: payload.locale ?? "es",
          monthlyWorkHours: derivedWorkSettings.monthlyWorkHours,
          workDaysPerYear: derivedWorkSettings.workDaysPerYear,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      settingsRow = insertedRows[0]
    } else {
      const updatedRows = await tx
        .update(userFinanceSettings)
        .set({
          currency: settingsCurrency,
          monthlyWorkHours: derivedWorkSettings.monthlyWorkHours,
          workDaysPerYear: derivedWorkSettings.workDaysPerYear,
          locale: payload.locale ?? existingSettings.locale,
          updatedAt: now,
        })
        .where(
          and(
            eq(userFinanceSettings.id, existingSettings.id),
            eq(userFinanceSettings.ownerUserId, ownerUserId),
            isNull(userFinanceSettings.deletedAt)
          )
        )
        .returning()

      settingsRow = updatedRows[0]
    }

    if (!settingsRow) {
      throw new ApiError(500, "INTERNAL_ERROR", "Failed to upsert finance settings")
    }

    await replaceUserWorkScheduleDays(ownerUserId, defaultWorkSchedule, now, tx)

    const userRows = await tx
      .update(user)
      .set({
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(user.id, ownerUserId))
      .returning({ onboardingCompletedAt: user.onboardingCompletedAt })

    const userRow = userRows[0]

    if (!userRow?.onboardingCompletedAt) {
      throw new ApiError(500, "INTERNAL_ERROR", "Failed to mark onboarding as completed")
    }

    return {
      completedAt: toIso(userRow.onboardingCompletedAt) ?? now.toISOString(),
      createdCompanies: createdCompanies.map(({ row, workSchedule }) =>
        mapPathCompanyEntity(row, workSchedule)
      ),
      createdEvents: createdEvents.map(mapPathCompanyEventEntity),
      settings: mapUserFinanceSettingsEntity(settingsRow, defaultWorkSchedule),
    }
  })

  await recomputeMonthlyIncomeLedgerFromDate(ownerUserId, earliestStartDate)

  return result
}
