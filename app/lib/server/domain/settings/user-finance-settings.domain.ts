import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { pathCompanies, userFinanceSettings } from "@/app/lib/db/schema"
import { currencyCodeSchema, normalizeCurrencyCode } from "@/app/lib/models/common/domain-enums"
import type {
  UserFinanceSettingsCreateInput,
  UserFinanceSettingsEntity,
  UserFinanceSettingsListParams,
  UserFinanceSettingsListResponse,
  UserFinanceSettingsUpdateInput,
} from "@/app/lib/models/settings/user-finance-settings.model"
import {
  buildDefaultWorkSchedule,
  deriveLegacyWorkSettingsFromSchedule,
  workScheduleSchema,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { ApiError } from "@/app/lib/server/api-error"
import { toIso, clampLimit, requirePatchPayload } from "@/app/lib/server/domain/common"
import {
  listUserWorkScheduleDays,
  replaceUserWorkScheduleDays,
  resolveUserWorkSchedule,
} from "@/app/lib/server/domain/finance/work-schedule.domain"
import { recomputeMonthlyIncomeLedgerFromDate } from "@/app/lib/server/domain/finance/monthly-income.domain"

const createSchema = z.object({
  currency: currencyCodeSchema,
  locale: z.string().trim().min(2).max(20),
  monthlyWorkHours: z.number().int().positive().max(744).optional(),
  workDaysPerYear: z.number().int().min(1).max(366).optional(),
  defaultWorkSchedule: workScheduleSchema.optional(),
})

const updateSchema = createSchema.partial()

function mapEntity(
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

async function recomputeMonthlyIncomeFromFirstCompany(ownerUserId: string) {
  const rows = await db
    .select({
      startDate: pathCompanies.startDate,
    })
    .from(pathCompanies)
    .where(and(eq(pathCompanies.ownerUserId, ownerUserId), isNull(pathCompanies.deletedAt)))
    .orderBy(pathCompanies.startDate)
    .limit(1)

  const firstCompany = rows[0]

  if (!firstCompany) {
    return
  }

  await recomputeMonthlyIncomeLedgerFromDate(ownerUserId, firstCompany.startDate)
}

export async function listUserFinanceSettings(
  ownerUserId: string,
  params: UserFinanceSettingsListParams = {}
): Promise<UserFinanceSettingsListResponse> {
  const limit = clampLimit(params.limit)

  const rows = await db
    .select()
    .from(userFinanceSettings)
    .where(and(eq(userFinanceSettings.ownerUserId, ownerUserId), isNull(userFinanceSettings.deletedAt)))
    .orderBy(desc(userFinanceSettings.updatedAt))
    .limit(limit)

  const schedule = (await listUserWorkScheduleDays(ownerUserId)) ?? buildDefaultWorkSchedule()

  return {
    items: rows.map((row) => mapEntity(row, schedule)),
    total: rows.length,
  }
}

export async function getUserFinanceSettingsById(
  ownerUserId: string,
  id: string
): Promise<UserFinanceSettingsEntity> {
  const rows = await db
    .select()
    .from(userFinanceSettings)
    .where(
      and(
        eq(userFinanceSettings.id, id),
        eq(userFinanceSettings.ownerUserId, ownerUserId),
        isNull(userFinanceSettings.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Finance settings not found")
  }

  const schedule = (await listUserWorkScheduleDays(ownerUserId)) ?? buildDefaultWorkSchedule()

  return mapEntity(row, schedule)
}

export async function createUserFinanceSettings(
  ownerUserId: string,
  input: UserFinanceSettingsCreateInput
): Promise<UserFinanceSettingsEntity> {
  const payload = createSchema.parse(input)

  const existingRows = await db
    .select({ id: userFinanceSettings.id })
    .from(userFinanceSettings)
    .where(and(eq(userFinanceSettings.ownerUserId, ownerUserId), isNull(userFinanceSettings.deletedAt)))
    .limit(1)

  if (existingRows.length > 0) {
    throw new ApiError(409, "CONFLICT", "Finance settings already exist for this user")
  }

  const schedule = payload.defaultWorkSchedule ?? buildDefaultWorkSchedule()
  const derived = deriveLegacyWorkSettingsFromSchedule(schedule)
  const now = new Date()

  const rows = await db
    .insert(userFinanceSettings)
    .values({
      id: crypto.randomUUID(),
      ownerUserId,
      currency: payload.currency,
      locale: payload.locale,
      monthlyWorkHours: derived.monthlyWorkHours,
      workDaysPerYear: derived.workDaysPerYear,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create finance settings")
  }

  await replaceUserWorkScheduleDays(ownerUserId, schedule, now)
  await recomputeMonthlyIncomeFromFirstCompany(ownerUserId)

  return mapEntity(row, schedule)
}

export async function updateUserFinanceSettings(
  ownerUserId: string,
  id: string,
  input: UserFinanceSettingsUpdateInput
): Promise<UserFinanceSettingsEntity> {
  const payload = requirePatchPayload(updateSchema.parse(input))

  const existingRows = await db
    .select()
    .from(userFinanceSettings)
    .where(
      and(
        eq(userFinanceSettings.id, id),
        eq(userFinanceSettings.ownerUserId, ownerUserId),
        isNull(userFinanceSettings.deletedAt)
      )
    )
    .limit(1)

  const existing = existingRows[0]

  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Finance settings not found")
  }

  const currentSchedule = await resolveUserWorkSchedule(ownerUserId)
  const nextSchedule = payload.defaultWorkSchedule ?? currentSchedule
  const derived = deriveLegacyWorkSettingsFromSchedule(nextSchedule)
  const now = new Date()

  const rows = await db
    .update(userFinanceSettings)
    .set({
      currency: payload.currency ?? existing.currency,
      locale: payload.locale ?? existing.locale,
      monthlyWorkHours: derived.monthlyWorkHours,
      workDaysPerYear: derived.workDaysPerYear,
      updatedAt: now,
    })
    .where(
      and(
        eq(userFinanceSettings.id, id),
        eq(userFinanceSettings.ownerUserId, ownerUserId),
        isNull(userFinanceSettings.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Finance settings not found")
  }

  if (payload.defaultWorkSchedule !== undefined) {
    await replaceUserWorkScheduleDays(ownerUserId, nextSchedule, now)
    await recomputeMonthlyIncomeFromFirstCompany(ownerUserId)
  }

  return mapEntity(row, nextSchedule)
}

export async function deleteUserFinanceSettings(ownerUserId: string, id: string) {
  const deletedAt = new Date()

  const rows = await db
    .update(userFinanceSettings)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(
      and(
        eq(userFinanceSettings.id, id),
        eq(userFinanceSettings.ownerUserId, ownerUserId),
        isNull(userFinanceSettings.deletedAt)
      )
    )
    .returning({ id: userFinanceSettings.id, deletedAt: userFinanceSettings.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Finance settings not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}

export async function upsertUserFinanceSettings(
  ownerUserId: string,
  input: UserFinanceSettingsCreateInput
): Promise<UserFinanceSettingsEntity> {
  const payload = createSchema.parse(input)

  const existingRows = await db
    .select()
    .from(userFinanceSettings)
    .where(and(eq(userFinanceSettings.ownerUserId, ownerUserId), isNull(userFinanceSettings.deletedAt)))
    .limit(1)

  const existing = existingRows[0]

  if (!existing) {
    return createUserFinanceSettings(ownerUserId, payload)
  }

  const currentSchedule = await resolveUserWorkSchedule(ownerUserId)
  const nextSchedule = payload.defaultWorkSchedule ?? currentSchedule
  const derived = deriveLegacyWorkSettingsFromSchedule(nextSchedule)
  const now = new Date()

  const rows = await db
    .update(userFinanceSettings)
    .set({
      currency: payload.currency,
      locale: payload.locale,
      monthlyWorkHours: derived.monthlyWorkHours,
      workDaysPerYear: derived.workDaysPerYear,
      updatedAt: now,
    })
    .where(
      and(
        eq(userFinanceSettings.id, existing.id),
        eq(userFinanceSettings.ownerUserId, ownerUserId),
        isNull(userFinanceSettings.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to upsert finance settings")
  }

  if (payload.defaultWorkSchedule !== undefined) {
    await replaceUserWorkScheduleDays(ownerUserId, nextSchedule, now)
    await recomputeMonthlyIncomeFromFirstCompany(ownerUserId)
  }

  return mapEntity(row, nextSchedule)
}
