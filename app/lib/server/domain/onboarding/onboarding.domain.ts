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
import type {
  OnboardingCompleteInput,
  OnboardingCompleteResponse,
  OnboardingStatusResponse,
} from "@/app/lib/models/onboarding/onboarding.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { UserFinanceSettingsEntity } from "@/app/lib/models/settings/user-finance-settings.model"
import { getRandomCompanyColor } from "@/app/lib/models/personal-path/company-colors"
import { ApiError } from "@/app/lib/server/api-error"
import { normalizeSearchText, toIso, toSlug } from "@/app/lib/server/domain/common"
import { syncEndOfEmploymentEvent } from "@/app/lib/server/domain/personal-path/end-of-employment-event-sync"

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

const completeSchema = z
  .object({
    companyName: z.string().trim().min(1).max(120),
    roleName: z.string().trim().min(1).max(120),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    compensationType: z.enum(["hourly", "monthly"]),
    currency: z.string().trim().min(1).max(10),
    initialRate: z.number().min(0),
    currentRate: z.number().min(0),
    monthlyWorkHours: z.number().int().positive().max(744).optional(),
    workDaysPerYear: z.number().int().min(1).max(366).optional(),
    locale: z.string().trim().min(2).max(20).optional(),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "endDate must be greater than or equal to startDate",
    path: ["endDate"],
  })

function mapPathCompanyEntity(row: typeof pathCompanies.$inferSelect): PathCompaniesEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    companyCatalogId: row.companyCatalogId,
    roleCatalogId: row.roleCatalogId,
    color: row.color,
    displayName: row.displayName,
    roleDisplayName: row.roleDisplayName,
    compensationType: row.compensationType as "hourly" | "monthly",
    currency: row.currency,
    score: row.score,
    review: row.review,
    startDate: toIso(row.startDate) ?? new Date(0).toISOString(),
    endDate: toIso(row.endDate),
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

function mapPathCompanyEventEntity(
  row: typeof pathCompanyEvents.$inferSelect
): PathCompanyEventsEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    pathCompanyId: row.pathCompanyId,
    eventType: row.eventType as PathCompanyEventsEntity["eventType"],
    effectiveDate: toIso(row.effectiveDate) ?? new Date(0).toISOString(),
    amount: row.amount,
    notes: row.notes,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

function mapUserFinanceSettingsEntity(
  row: typeof userFinanceSettings.$inferSelect
): UserFinanceSettingsEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    currency: row.currency,
    locale: row.locale,
    monthlyWorkHours: row.monthlyWorkHours,
    workDaysPerYear: row.workDaysPerYear,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function resolveCompanyCatalog(
  tx: DbTx,
  ownerUserId: string,
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
      ownerUserId,
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
  ownerUserId: string,
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
      ownerUserId,
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

  return db.transaction(async (tx) => {
    const now = new Date()

    const company = await resolveCompanyCatalog(tx, ownerUserId, payload.companyName, now)
    const role = await resolveRoleCatalog(tx, ownerUserId, payload.roleName, now)

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
        compensationType: payload.compensationType,
        currency: payload.currency,
        score: 5,
        review: "",
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const pathCompany = pathCompanyRows[0]

    if (!pathCompany) {
      throw new ApiError(500, "INTERNAL_ERROR", "Failed to create initial path company")
    }

    const startEventRows = await tx
      .insert(pathCompanyEvents)
      .values({
        id: crypto.randomUUID(),
        ownerUserId,
        pathCompanyId: pathCompany.id,
        eventType: "start_rate",
        effectiveDate: payload.startDate,
        amount: payload.initialRate,
        notes: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const startEvent = startEventRows[0]

    if (!startEvent) {
      throw new ApiError(500, "INTERNAL_ERROR", "Failed to create initial rate event")
    }

    const createdEvents = [startEvent]

    if (payload.currentRate !== payload.initialRate) {
      const rateIncreaseRows = await tx
        .insert(pathCompanyEvents)
        .values({
          id: crypto.randomUUID(),
          ownerUserId,
          pathCompanyId: pathCompany.id,
          eventType: "rate_increase",
          effectiveDate: payload.endDate ?? now,
          amount: payload.currentRate,
          notes: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      const rateIncreaseEvent = rateIncreaseRows[0]

      if (!rateIncreaseEvent) {
        throw new ApiError(500, "INTERNAL_ERROR", "Failed to create current rate event")
      }

      createdEvents.push(rateIncreaseEvent)
    }

    if (payload.endDate) {
      await syncEndOfEmploymentEvent(tx, {
        ownerUserId,
        pathCompanyId: pathCompany.id,
        endDate: payload.endDate,
        now,
      })

      const endEventRows = await tx
        .select()
        .from(pathCompanyEvents)
        .where(
          and(
            eq(pathCompanyEvents.ownerUserId, ownerUserId),
            eq(pathCompanyEvents.pathCompanyId, pathCompany.id),
            eq(pathCompanyEvents.eventType, "end_of_employment"),
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

    let settingsRow: typeof userFinanceSettings.$inferSelect | undefined

    if (!existingSettings) {
      const insertedRows = await tx
        .insert(userFinanceSettings)
        .values({
          id: crypto.randomUUID(),
          ownerUserId,
          currency: payload.currency,
          locale: payload.locale ?? "es",
          monthlyWorkHours: payload.monthlyWorkHours ?? 174,
          workDaysPerYear: payload.workDaysPerYear ?? 261,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      settingsRow = insertedRows[0]
    } else {
      const updatedRows = await tx
        .update(userFinanceSettings)
        .set({
          currency: payload.currency,
          monthlyWorkHours: payload.monthlyWorkHours ?? existingSettings.monthlyWorkHours,
          workDaysPerYear: payload.workDaysPerYear ?? existingSettings.workDaysPerYear,
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
      pathCompany: mapPathCompanyEntity(pathCompany),
      createdEvents: createdEvents.map(mapPathCompanyEventEntity),
      settings: mapUserFinanceSettingsEntity(settingsRow),
    }
  })
}
