import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { companyCatalog, pathCompanies, pathCompanyEvents, roleCatalog } from "@/app/lib/db/schema"
import {
  coerceCompanyColor,
  getRandomCompanyColor,
  isValidCompanyColor,
} from "@/app/lib/models/personal-path/company-colors"
import type {
  PathCompaniesCreateInput,
  PathCompaniesEntity,
  PathCompaniesListParams,
  PathCompaniesListResponse,
  PathCompaniesUpdateInput,
} from "@/app/lib/models/personal-path/path-companies.model"
import { ApiError } from "@/app/lib/server/api-error"
import { clampLimit, requirePatchPayload, toIso } from "@/app/lib/server/domain/common"
import { resolveCompanyCatalogByName } from "@/app/lib/server/domain/companies/company-catalog.domain"
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
  compensationType: z.enum(["hourly", "monthly"]).optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  score: z.number().int().min(1).max(10).optional(),
  review: z.string().trim().max(1000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
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

function mapEntity(row: typeof pathCompanies.$inferSelect): PathCompaniesEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    companyCatalogId: row.companyCatalogId,
    roleCatalogId: row.roleCatalogId,
    color: coerceCompanyColor(row.color),
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

async function resolveCompanyReference(
  ownerUserId: string,
  input: {
    companyName?: string
    displayName?: string
    companyCatalogId?: string | null
  }
) {
  const name = resolveName(input.companyName, input.displayName)

  if (name) {
    const resolved = await resolveCompanyCatalogByName(ownerUserId, name)
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

async function resolveRoleReference(
  ownerUserId: string,
  input: {
    roleName?: string
    roleDisplayName?: string
    roleCatalogId?: string | null
  }
) {
  const name = resolveName(input.roleName, input.roleDisplayName)

  if (name) {
    const resolved = await resolveRoleCatalogByName(ownerUserId, name)
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

export async function listPathCompanies(
  ownerUserId: string,
  params: PathCompaniesListParams = {}
): Promise<PathCompaniesListResponse> {
  const limit = clampLimit(params.limit)

  const rows = await db
    .select()
    .from(pathCompanies)
    .where(and(eq(pathCompanies.ownerUserId, ownerUserId), isNull(pathCompanies.deletedAt)))
    .orderBy(desc(pathCompanies.startDate))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getPathCompanyById(
  ownerUserId: string,
  pathCompanyId: string
): Promise<PathCompaniesEntity> {
  const row = await getRecordOrThrow(ownerUserId, pathCompanyId)
  return mapEntity(row)
}

export async function createPathCompany(
  ownerUserId: string,
  input: PathCompaniesCreateInput
): Promise<PathCompaniesEntity> {
  const payload = createSchema.parse(input)
  const now = new Date()
  const companyReference = await resolveCompanyReference(ownerUserId, payload)
  const roleReference = await resolveRoleReference(ownerUserId, payload)

  if (!companyReference) {
    throw new ApiError(400, "VALIDATION_ERROR", "companyName is required")
  }

  if (!roleReference) {
    throw new ApiError(400, "VALIDATION_ERROR", "roleName is required")
  }

  const rows = await db
    .insert(pathCompanies)
    .values({
      id: crypto.randomUUID(),
      ownerUserId,
      companyCatalogId: companyReference.companyCatalogId,
      roleCatalogId: roleReference.roleCatalogId,
      color: payload.color ?? getRandomCompanyColor(),
      displayName: companyReference.displayName,
      roleDisplayName: roleReference.roleDisplayName,
      compensationType: payload.compensationType ?? "monthly",
      currency: payload.currency ?? "USD",
      score: payload.score ?? 5,
      review: payload.review ?? "",
      startDate: payload.startDate,
      endDate: payload.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create path company")
  }

  return mapEntity(row)
}

export async function updatePathCompany(
  ownerUserId: string,
  pathCompanyId: string,
  input: PathCompaniesUpdateInput
): Promise<PathCompaniesEntity> {
  const payload = requirePatchPayload(updateSchema.parse(input))
  const current = await getRecordOrThrow(ownerUserId, pathCompanyId)

  const nextStartDate = payload.startDate ?? current.startDate
  const nextEndDate = Object.prototype.hasOwnProperty.call(payload, "endDate")
    ? payload.endDate ?? null
    : current.endDate

  if (nextEndDate && nextEndDate < nextStartDate) {
    throw new ApiError(400, "VALIDATION_ERROR", "endDate must be greater than or equal to startDate")
  }

  const nextValues: Partial<typeof pathCompanies.$inferInsert> = {}

  if (payload.companyName || payload.displayName || Object.prototype.hasOwnProperty.call(payload, "companyCatalogId")) {
    const companyReference = await resolveCompanyReference(ownerUserId, payload)

    if (companyReference) {
      nextValues.companyCatalogId = companyReference.companyCatalogId
      nextValues.displayName = companyReference.displayName
    } else if (Object.prototype.hasOwnProperty.call(payload, "companyCatalogId")) {
      nextValues.companyCatalogId = payload.companyCatalogId ?? null
    }
  }

  if (payload.roleName || payload.roleDisplayName || Object.prototype.hasOwnProperty.call(payload, "roleCatalogId")) {
    const roleReference = await resolveRoleReference(ownerUserId, payload)

    if (roleReference) {
      nextValues.roleCatalogId = roleReference.roleCatalogId
      nextValues.roleDisplayName = roleReference.roleDisplayName
    } else if (Object.prototype.hasOwnProperty.call(payload, "roleCatalogId")) {
      nextValues.roleCatalogId = payload.roleCatalogId ?? null
    }
  }

  if (payload.compensationType) {
    nextValues.compensationType = payload.compensationType
  }

  if (payload.currency) {
    nextValues.currency = payload.currency
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

  const rows = await db
    .update(pathCompanies)
    .set({
      ...nextValues,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(pathCompanies.id, pathCompanyId),
        eq(pathCompanies.ownerUserId, ownerUserId),
        isNull(pathCompanies.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Path company not found")
  }

  return mapEntity(row)
}

export async function deletePathCompany(ownerUserId: string, pathCompanyId: string) {
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
          eq(pathCompanyEvents.ownerUserId, ownerUserId),
          isNull(pathCompanyEvents.deletedAt)
        )
      )

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

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}
