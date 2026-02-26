import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import {
  companyCatalog,
  pathCompanies,
  pathCompanyEvents,
  roleCatalog,
  userMonthlyIncomeSources,
} from "@/app/lib/db/schema"
import {
  CompensationType,
  CurrencyCode,
  compensationTypeSchema,
  currencyCodeSchema,
  normalizeCompensationType,
  normalizeCurrencyCode,
} from "@/app/lib/models/common/domain-enums"
import {
  coerceCompanyColor,
  getRandomCompanyColor,
  isValidCompanyColor,
} from "@/app/lib/models/personal-path/company-colors"
import type {
  PathCompaniesCreateInput,
  PathCompaniesEntity,
  PathCompaniesListResponse,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import {
  areWorkSchedulesEqual,
  workScheduleSchema,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { ApiError } from "@/app/lib/server/api-error"
import { requirePatchPayload, toIso } from "@/app/lib/server/domain/common"
import { resolveCompanyCatalogByName } from "@/app/lib/server/domain/companies/company-catalog.domain"
import { recomputeMonthlyIncomeLedgerFromDate } from "@/app/lib/server/domain/finance/monthly-income.domain"
import {
  clearPathCompanyWorkScheduleDays,
  listPathCompanyWorkScheduleDays,
  replacePathCompanyWorkScheduleDays,
  resolveUserWorkSchedule,
} from "@/app/lib/server/domain/finance/work-schedule.domain"
import {
  clearEndOfEmploymentEvents,
  syncEndOfEmploymentEvent,
} from "@/app/lib/server/domain/personal-path/end-of-employment-event-sync"
import { resolveRoleCatalogByName } from "@/app/lib/server/domain/roles/role-catalog.domain"

const colorSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => isValidCompanyColor(value), {
    message: "color must be a valid hex color",
  })

const baseSchema = z.object({
  companyCatalogId: z.string().trim().min(1).nullable().optional(),
  roleCatalogId: z.string().trim().min(1).nullable().optional(),
  companyName: z.string().trim().min(1).max(160).optional(),
  roleName: z.string().trim().min(1).max(160).optional(),
  displayName: z.string().trim().min(1).max(160).optional(),
  roleDisplayName: z.string().trim().min(1).max(160).optional(),
  color: colorSchema.optional(),
  compensationType: compensationTypeSchema.optional(),
  currency: currencyCodeSchema.optional(),
  score: z.number().int().min(1).max(10).optional(),
  review: z.string().trim().max(1000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  workSchedule: workScheduleSchema.nullable().optional(),
})

const createSchema = baseSchema
  .extend({
    startDate: z.coerce.date(),
  })
  .refine(
    (value) => {
      const companyName = value.companyName ?? value.displayName
      return Boolean(companyName?.trim())
    },
    {
      message: "companyName is required",
      path: ["companyName"],
    }
  )
  .refine(
    (value) => {
      const roleName = value.roleName ?? value.roleDisplayName
      return Boolean(roleName?.trim())
    },
    {
      message: "roleName is required",
      path: ["roleName"],
    }
  )
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "endDate must be greater than or equal to startDate",
    path: ["endDate"],
  })

const updateSchema = baseSchema.partial()

function mapEntity(
  row: typeof pathCompanies.$inferSelect,
  workSchedule: PathCompaniesEntity["workSchedule"] = null
): PathCompaniesEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    companyCatalogId: row.companyCatalogId,
    roleCatalogId: row.roleCatalogId,
    color: coerceCompanyColor(row.color),
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

function resolveName(primary?: string, fallback?: string): string | null {
  const value = primary?.trim() || fallback?.trim()
  return value?.length ? value : null
}

async function getCompanyCatalogByIdOrThrow(companyId: string) {
  const rows = await db
    .select()
    .from(companyCatalog)
    .where(and(eq(companyCatalog.id, companyId), isNull(companyCatalog.deletedAt)))
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Company catalog not found")
  }

  return row
}

async function getRoleCatalogByIdOrThrow(roleId: string) {
  const rows = await db
    .select()
    .from(roleCatalog)
    .where(and(eq(roleCatalog.id, roleId), isNull(roleCatalog.deletedAt)))
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Role catalog not found")
  }

  return row
}

async function resolveCompanyReference(input: {
    companyName?: string
    displayName?: string
    companyCatalogId?: string | null
  }) {
  const name = resolveName(input.companyName, input.displayName)

  if (name) {
    const resolved = await resolveCompanyCatalogByName(name)
    return {
      companyCatalogId: resolved.id,
      displayName: resolved.name,
    }
  }

  if (input.companyCatalogId) {
    const resolved = await getCompanyCatalogByIdOrThrow(input.companyCatalogId)
    return {
      companyCatalogId: resolved.id,
      displayName: resolved.name,
    }
  }

  return null
}

async function resolveRoleReference(input: {
    roleName?: string
    roleDisplayName?: string
    roleCatalogId?: string | null
  }) {
  const name = resolveName(input.roleName, input.roleDisplayName)

  if (name) {
    const resolved = await resolveRoleCatalogByName(name)
    return {
      roleCatalogId: resolved.id,
      roleDisplayName: resolved.name,
    }
  }

  if (input.roleCatalogId) {
    const resolved = await getRoleCatalogByIdOrThrow(input.roleCatalogId)
    return {
      roleCatalogId: resolved.id,
      roleDisplayName: resolved.name,
    }
  }

  return null
}

async function getRecordOrThrow(ownerUserId: string, pathCompanyId: string) {
  const rows = await db
    .select()
    .from(pathCompanies)
    .where(
      and(
        eq(pathCompanies.id, pathCompanyId),
        eq(pathCompanies.ownerUserId, ownerUserId),
        isNull(pathCompanies.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Path company not found")
  }

  return row
}

export async function assertPathCompanyOwnership(ownerUserId: string, pathCompanyId: string) {
  return getRecordOrThrow(ownerUserId, pathCompanyId)
}

export async function listPathCompanies(ownerUserId: string): Promise<PathCompaniesListResponse> {
  const rows = await db
    .select()
    .from(pathCompanies)
    .where(and(eq(pathCompanies.ownerUserId, ownerUserId), isNull(pathCompanies.deletedAt)))
    .orderBy(desc(pathCompanies.startDate))
  const scheduleByCompanyId = await listPathCompanyWorkScheduleDays(rows.map((row) => row.id))

  return {
    items: rows.map((row) => mapEntity(row, scheduleByCompanyId.get(row.id) ?? null)),
    total: rows.length,
  }
}

export async function getPathCompanyById(
  ownerUserId: string,
  pathCompanyId: string
): Promise<PathCompaniesEntity> {
  const row = await getRecordOrThrow(ownerUserId, pathCompanyId)
  const scheduleByCompanyId = await listPathCompanyWorkScheduleDays([row.id])
  return mapEntity(row, scheduleByCompanyId.get(row.id) ?? null)
}

export async function createPathCompany(
  ownerUserId: string,
  input: PathCompaniesCreateInput
): Promise<PathCompaniesEntity> {
  const payload = createSchema.parse(input)
  const now = new Date()
  const companyReference = await resolveCompanyReference(payload)
  const roleReference = await resolveRoleReference(payload)
  const userSchedule = await resolveUserWorkSchedule(ownerUserId)
  const nextWorkSchedule = payload.workSchedule ?? userSchedule

  if (!companyReference) {
    throw new ApiError(400, "VALIDATION_ERROR", "companyName is required")
  }

  if (!roleReference) {
    throw new ApiError(400, "VALIDATION_ERROR", "roleName is required")
  }

  const row = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(pathCompanies)
      .values({
        id: crypto.randomUUID(),
        ownerUserId,
        companyCatalogId: companyReference.companyCatalogId,
        roleCatalogId: roleReference.roleCatalogId,
        color: payload.color ?? getRandomCompanyColor(),
        displayName: companyReference.displayName,
        roleDisplayName: roleReference.roleDisplayName,
        compensationType: payload.compensationType ?? CompensationType.MONTHLY,
        currency: payload.currency ?? CurrencyCode.USD,
        score: payload.score ?? 5,
        review: payload.review ?? "",
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const inserted = rows[0]

    if (!inserted) {
      throw new ApiError(500, "INTERNAL_ERROR", "Failed to create path company")
    }

    if (inserted.endDate) {
      await syncEndOfEmploymentEvent(tx, {
        pathCompanyId: inserted.id,
        endDate: inserted.endDate,
        now,
      })
    }

    await replacePathCompanyWorkScheduleDays(inserted.id, nextWorkSchedule, now, tx)

    return inserted
  })

  await recomputeMonthlyIncomeLedgerFromDate(ownerUserId, payload.startDate)

  return mapEntity(row, nextWorkSchedule)
}

export async function updatePathCompany(
  ownerUserId: string,
  pathCompanyId: string,
  input: PathCompaniesUpdateInput
): Promise<PathCompaniesEntity> {
  const parsedPayload = requirePatchPayload(updateSchema.parse(input))
  const hasWorkScheduleField = Object.prototype.hasOwnProperty.call(parsedPayload, "workSchedule")
  const needsCompanyResolve = Boolean(
    parsedPayload.companyName ||
    parsedPayload.displayName ||
    Object.prototype.hasOwnProperty.call(parsedPayload, "companyCatalogId")
  )
  const needsRoleResolve = Boolean(
    parsedPayload.roleName ||
    parsedPayload.roleDisplayName ||
    Object.prototype.hasOwnProperty.call(parsedPayload, "roleCatalogId")
  )

  const [current, currentScheduleMap, companyReference, roleReference] = await Promise.all([
    getRecordOrThrow(ownerUserId, pathCompanyId),
    listPathCompanyWorkScheduleDays([pathCompanyId]),
    needsCompanyResolve ? resolveCompanyReference(parsedPayload) : null,
    needsRoleResolve ? resolveRoleReference(parsedPayload) : null,
  ])
  const currentSchedule = currentScheduleMap.get(pathCompanyId) ?? null
  const payload = { ...parsedPayload }
  const hasWorkScheduleChange = hasWorkScheduleField
    ? !areWorkSchedulesEqual(payload.workSchedule ?? null, currentSchedule)
    : false

  if (hasWorkScheduleField && !hasWorkScheduleChange) {
    delete payload.workSchedule
  }

  if (Object.keys(payload).length === 0) {
    return mapEntity(current, currentSchedule)
  }

  const hasEndDateChange = Object.prototype.hasOwnProperty.call(payload, "endDate")

  const nextStartDate = payload.startDate ?? current.startDate
  const nextEndDate = Object.prototype.hasOwnProperty.call(payload, "endDate")
    ? payload.endDate ?? null
    : current.endDate

  if (nextEndDate && nextEndDate < nextStartDate) {
    throw new ApiError(400, "VALIDATION_ERROR", "endDate must be greater than or equal to startDate")
  }

  const nextValues: Partial<typeof pathCompanies.$inferInsert> = {}

  if (needsCompanyResolve) {
    if (companyReference) {
      nextValues.companyCatalogId = companyReference.companyCatalogId
      nextValues.displayName = companyReference.displayName
    } else if (Object.prototype.hasOwnProperty.call(payload, "companyCatalogId")) {
      nextValues.companyCatalogId = payload.companyCatalogId ?? null
    }
  }

  if (needsRoleResolve) {
    if (roleReference) {
      nextValues.roleCatalogId = roleReference.roleCatalogId
      nextValues.roleDisplayName = roleReference.roleDisplayName
    } else if (Object.prototype.hasOwnProperty.call(payload, "roleCatalogId")) {
      nextValues.roleCatalogId = payload.roleCatalogId ?? null
    }
  }

  if (payload.compensationType) {
    nextValues.compensationType = normalizeCompensationType(payload.compensationType)
  }

  if (payload.currency) {
    nextValues.currency = normalizeCurrencyCode(payload.currency)
  }

  if (payload.score !== undefined) {
    nextValues.score = payload.score
  }

  if (payload.review !== undefined) {
    nextValues.review = payload.review
  }

  if (payload.startDate) {
    nextValues.startDate = payload.startDate
  }

  if (Object.prototype.hasOwnProperty.call(payload, "endDate")) {
    nextValues.endDate = payload.endDate ?? null
  }

  if (payload.color) {
    nextValues.color = payload.color
  }

  const updatedAt = new Date()
  const affectedStartDate = new Date(
    Math.min(current.startDate.getTime(), nextStartDate.getTime())
  )

  const row = await db.transaction(async (tx) => {
    const rows = await tx
      .update(pathCompanies)
      .set({
        ...nextValues,
        updatedAt,
      })
      .where(
        and(
          eq(pathCompanies.id, pathCompanyId),
          eq(pathCompanies.ownerUserId, ownerUserId),
          isNull(pathCompanies.deletedAt)
        )
      )
      .returning()

    const updated = rows[0]

    if (!updated) {
      return null
    }

    if (hasEndDateChange && nextEndDate) {
      await syncEndOfEmploymentEvent(tx, {
        pathCompanyId,
        endDate: nextEndDate,
        now: updatedAt,
      })
    } else if (hasEndDateChange) {
      await clearEndOfEmploymentEvents(tx, {
        pathCompanyId,
        now: updatedAt,
      })
    }

    if (hasWorkScheduleChange) {
      if (payload.workSchedule === null) {
        await clearPathCompanyWorkScheduleDays(pathCompanyId, updatedAt, tx)
      } else if (payload.workSchedule) {
        await replacePathCompanyWorkScheduleDays(pathCompanyId, payload.workSchedule, updatedAt, tx)
      }
    }

    return updated
  })

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Path company not found")
  }

  const needsIncomeRecompute = Boolean(
    payload.startDate ||
    hasEndDateChange ||
    payload.compensationType ||
    payload.currency ||
    hasWorkScheduleChange
  )

  if (needsIncomeRecompute) {
    await recomputeMonthlyIncomeLedgerFromDate(ownerUserId, affectedStartDate)
  } else if (nextValues.displayName) {
    await db
      .update(userMonthlyIncomeSources)
      .set({
        companyNameSnapshot: nextValues.displayName,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userMonthlyIncomeSources.pathCompanyId, pathCompanyId),
          isNull(userMonthlyIncomeSources.deletedAt)
        )
      )
  }

  return mapEntity(
    row,
    hasWorkScheduleChange
      ? payload.workSchedule ?? null
      : currentSchedule
  )
}

export async function deletePathCompany(ownerUserId: string, pathCompanyId: string) {
  const current = await getRecordOrThrow(ownerUserId, pathCompanyId)
  const deletedAt = new Date()

  const row = await db.transaction(async (tx) => {
    await tx
      .update(pathCompanyEvents)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(
        and(
          eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
          isNull(pathCompanyEvents.deletedAt)
        )
      )

    await clearPathCompanyWorkScheduleDays(pathCompanyId, deletedAt, tx)

    const rows = await tx
      .update(pathCompanies)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(
        and(
          eq(pathCompanies.id, pathCompanyId),
          eq(pathCompanies.ownerUserId, ownerUserId),
          isNull(pathCompanies.deletedAt)
        )
      )
      .returning({ id: pathCompanies.id, deletedAt: pathCompanies.deletedAt })

    return rows[0]
  })

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Path company not found")
  }

  await recomputeMonthlyIncomeLedgerFromDate(ownerUserId, current.startDate)

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}
