import { and, desc, eq, isNull, like } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { companyCatalog } from "@/app/lib/db/schema"
import type {
  CompanyCatalogCreateInput,
  CompanyCatalogEntity,
  CompanyCatalogListParams,
  CompanyCatalogListResponse,
  CompanyCatalogUpdateInput,
} from "@/app/lib/models/companies/company-catalog.model"
import { ApiError } from "@/app/lib/server/api-error"
import {
  clampLimit,
  normalizeSearchText,
  requirePatchPayload,
  toIso,
  toSlug,
} from "@/app/lib/server/domain/common"

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).optional(),
  industry: z.string().trim().max(120).nullable().optional(),
})

const updateSchema = createSchema.partial()

function mapEntity(row: typeof companyCatalog.$inferSelect): CompanyCatalogEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    nameNormalized: row.nameNormalized,
    slug: row.slug,
    industry: row.industry,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

export async function listCompanyCatalog(
  params: CompanyCatalogListParams = {}
): Promise<CompanyCatalogListResponse> {
  const limit = clampLimit(params.limit)
  const search = params.search?.trim()

  const whereCondition = search
    ? and(
        isNull(companyCatalog.deletedAt),
        like(companyCatalog.nameNormalized, `%${normalizeSearchText(search)}%`)
      )
    : isNull(companyCatalog.deletedAt)

  const rows = await db
    .select()
    .from(companyCatalog)
    .where(whereCondition)
    .orderBy(desc(companyCatalog.createdAt))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getCompanyCatalogById(
  _ownerUserId: string,
  companyId: string
): Promise<CompanyCatalogEntity> {
  const rows = await db
    .select()
    .from(companyCatalog)
    .where(
      and(
        eq(companyCatalog.id, companyId),
        isNull(companyCatalog.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Company not found")
  }

  return mapEntity(row)
}

export async function createCompanyCatalog(
  ownerUserId: string,
  input: CompanyCatalogCreateInput
): Promise<CompanyCatalogEntity> {
  const payload = createSchema.parse(input)
  const nameNormalized = normalizeSearchText(payload.name)
  const slug = payload.slug ? toSlug(payload.slug) : toSlug(payload.name)

  const now = new Date()
  const rows = await db
    .insert(companyCatalog)
    .values({
      id: crypto.randomUUID(),
      ownerUserId,
      name: payload.name,
      nameNormalized,
      slug,
      industry: payload.industry ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create company")
  }

  return mapEntity(row)
}

export async function updateCompanyCatalog(
  ownerUserId: string,
  companyId: string,
  input: CompanyCatalogUpdateInput
): Promise<CompanyCatalogEntity> {
  const parsed = requirePatchPayload(updateSchema.parse(input))
  const payload = {
    ...parsed,
    ...(parsed.name ? { nameNormalized: normalizeSearchText(parsed.name) } : {}),
    ...(parsed.slug ? { slug: toSlug(parsed.slug) } : {}),
  }

  const rows = await db
    .update(companyCatalog)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(companyCatalog.id, companyId),
        eq(companyCatalog.ownerUserId, ownerUserId),
        isNull(companyCatalog.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Company not found")
  }

  return mapEntity(row)
}

export async function deleteCompanyCatalog(ownerUserId: string, companyId: string) {
  const deletedAt = new Date()

  const rows = await db
    .update(companyCatalog)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(
      and(
        eq(companyCatalog.id, companyId),
        eq(companyCatalog.ownerUserId, ownerUserId),
        isNull(companyCatalog.deletedAt)
      )
    )
    .returning({ id: companyCatalog.id, deletedAt: companyCatalog.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Company not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}

export async function findCompanyCatalogByName(name: string): Promise<CompanyCatalogEntity | null> {
  const normalizedName = normalizeSearchText(name)

  const rows = await db
    .select()
    .from(companyCatalog)
    .where(
      and(
        eq(companyCatalog.nameNormalized, normalizedName),
        isNull(companyCatalog.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]
  return row ? mapEntity(row) : null
}

export async function resolveCompanyCatalogByName(
  ownerUserId: string,
  name: string
): Promise<CompanyCatalogEntity> {
  const existing = await findCompanyCatalogByName(name)

  if (existing) {
    return existing
  }

  const created = await createCompanyCatalog(ownerUserId, {
    name,
    slug: toSlug(name),
  })

  return created
}
