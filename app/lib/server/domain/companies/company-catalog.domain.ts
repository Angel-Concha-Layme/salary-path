import { and, desc, eq, isNull, like, ne } from "drizzle-orm"
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
    name: row.name,
    nameNormalized: row.nameNormalized,
    slug: row.slug,
    industry: row.industry,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function resolveAvailableSlug(slugInput: string, excludeId?: string): Promise<string> {
  const baseSlug = toSlug(slugInput) || `company-${crypto.randomUUID().slice(0, 8)}`
  let slug = baseSlug
  let suffix = 2

  while (true) {
    const rows = await db
      .select({ id: companyCatalog.id })
      .from(companyCatalog)
      .where(eq(companyCatalog.slug, slug))
      .limit(1)

    if (!rows[0] || rows[0].id === excludeId) {
      return slug
    }

    slug = `${baseSlug}-${suffix}`
    suffix += 1
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

export async function getCompanyCatalogById(companyId: string): Promise<CompanyCatalogEntity> {
  const rows = await db
    .select()
    .from(companyCatalog)
    .where(and(eq(companyCatalog.id, companyId), isNull(companyCatalog.deletedAt)))
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Company not found")
  }

  return mapEntity(row)
}

export async function createCompanyCatalog(
  input: CompanyCatalogCreateInput
): Promise<CompanyCatalogEntity> {
  const payload = createSchema.parse(input)
  const nameNormalized = normalizeSearchText(payload.name)

  const existingByNameRows = await db
    .select()
    .from(companyCatalog)
    .where(
      and(
        eq(companyCatalog.nameNormalized, nameNormalized),
        isNull(companyCatalog.deletedAt)
      )
    )
    .limit(1)

  const existingByName = existingByNameRows[0]

  if (existingByName) {
    return mapEntity(existingByName)
  }

  const slug = await resolveAvailableSlug(payload.slug ?? payload.name)
  const now = new Date()

  const rows = await db
    .insert(companyCatalog)
    .values({
      id: crypto.randomUUID(),
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
  companyId: string,
  input: CompanyCatalogUpdateInput
): Promise<CompanyCatalogEntity> {
  const parsed = requirePatchPayload(updateSchema.parse(input))
  const nextNameNormalized = parsed.name ? normalizeSearchText(parsed.name) : undefined

  if (nextNameNormalized) {
    const conflictingRows = await db
      .select({ id: companyCatalog.id })
      .from(companyCatalog)
      .where(
        and(
          eq(companyCatalog.nameNormalized, nextNameNormalized),
          isNull(companyCatalog.deletedAt),
          ne(companyCatalog.id, companyId)
        )
      )
      .limit(1)

    if (conflictingRows[0]) {
      throw new ApiError(409, "CONFLICT", "Company name already exists")
    }
  }

  const payload = {
    ...parsed,
    ...(nextNameNormalized ? { nameNormalized: nextNameNormalized } : {}),
    ...(parsed.slug ? { slug: await resolveAvailableSlug(parsed.slug, companyId) } : {}),
  }

  const rows = await db
    .update(companyCatalog)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(and(eq(companyCatalog.id, companyId), isNull(companyCatalog.deletedAt)))
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Company not found")
  }

  return mapEntity(row)
}

export async function deleteCompanyCatalog(companyId: string) {
  const deletedAt = new Date()

  const rows = await db
    .update(companyCatalog)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(and(eq(companyCatalog.id, companyId), isNull(companyCatalog.deletedAt)))
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
    .where(and(eq(companyCatalog.nameNormalized, normalizedName), isNull(companyCatalog.deletedAt)))
    .limit(1)

  const row = rows[0]
  return row ? mapEntity(row) : null
}

export async function resolveCompanyCatalogByName(name: string): Promise<CompanyCatalogEntity> {
  const existing = await findCompanyCatalogByName(name)

  if (existing) {
    return existing
  }

  return createCompanyCatalog({
    name,
    slug: toSlug(name),
  })
}
