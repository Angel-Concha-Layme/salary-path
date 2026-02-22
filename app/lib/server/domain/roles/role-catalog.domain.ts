import { and, desc, eq, isNull, like, ne } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { roleCatalog } from "@/app/lib/db/schema"
import type {
  RoleCatalogCreateInput,
  RoleCatalogEntity,
  RoleCatalogListParams,
  RoleCatalogListResponse,
  RoleCatalogUpdateInput,
} from "@/app/lib/models/roles/role-catalog.model"
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
})

const updateSchema = createSchema.partial()

function mapEntity(row: typeof roleCatalog.$inferSelect): RoleCatalogEntity {
  return {
    id: row.id,
    name: row.name,
    nameNormalized: row.nameNormalized,
    slug: row.slug,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function resolveAvailableSlug(slugInput: string, excludeId?: string): Promise<string> {
  const baseSlug = toSlug(slugInput) || `role-${crypto.randomUUID().slice(0, 8)}`
  let slug = baseSlug
  let suffix = 2

  while (true) {
    const rows = await db
      .select({ id: roleCatalog.id })
      .from(roleCatalog)
      .where(eq(roleCatalog.slug, slug))
      .limit(1)

    if (!rows[0] || rows[0].id === excludeId) {
      return slug
    }

    slug = `${baseSlug}-${suffix}`
    suffix += 1
  }
}

export async function listRoleCatalog(
  params: RoleCatalogListParams = {}
): Promise<RoleCatalogListResponse> {
  const limit = clampLimit(params.limit)
  const search = params.search?.trim()

  const whereCondition = search
    ? and(
        isNull(roleCatalog.deletedAt),
        like(roleCatalog.nameNormalized, `%${normalizeSearchText(search)}%`)
      )
    : isNull(roleCatalog.deletedAt)

  const rows = await db
    .select()
    .from(roleCatalog)
    .where(whereCondition)
    .orderBy(desc(roleCatalog.createdAt))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getRoleCatalogById(roleId: string): Promise<RoleCatalogEntity> {
  const rows = await db
    .select()
    .from(roleCatalog)
    .where(and(eq(roleCatalog.id, roleId), isNull(roleCatalog.deletedAt)))
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Role not found")
  }

  return mapEntity(row)
}

export async function createRoleCatalog(
  input: RoleCatalogCreateInput
): Promise<RoleCatalogEntity> {
  const payload = createSchema.parse(input)
  const nameNormalized = normalizeSearchText(payload.name)

  const existingByNameRows = await db
    .select()
    .from(roleCatalog)
    .where(and(eq(roleCatalog.nameNormalized, nameNormalized), isNull(roleCatalog.deletedAt)))
    .limit(1)

  const existingByName = existingByNameRows[0]

  if (existingByName) {
    return mapEntity(existingByName)
  }

  const slug = await resolveAvailableSlug(payload.slug ?? payload.name)
  const now = new Date()

  const rows = await db
    .insert(roleCatalog)
    .values({
      id: crypto.randomUUID(),
      name: payload.name,
      nameNormalized,
      slug,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create role")
  }

  return mapEntity(row)
}

export async function updateRoleCatalog(
  roleId: string,
  input: RoleCatalogUpdateInput
): Promise<RoleCatalogEntity> {
  const parsed = requirePatchPayload(updateSchema.parse(input))
  const nextNameNormalized = parsed.name ? normalizeSearchText(parsed.name) : undefined

  if (nextNameNormalized) {
    const conflictingRows = await db
      .select({ id: roleCatalog.id })
      .from(roleCatalog)
      .where(
        and(
          eq(roleCatalog.nameNormalized, nextNameNormalized),
          isNull(roleCatalog.deletedAt),
          ne(roleCatalog.id, roleId)
        )
      )
      .limit(1)

    if (conflictingRows[0]) {
      throw new ApiError(409, "CONFLICT", "Role name already exists")
    }
  }

  const payload = {
    ...parsed,
    ...(nextNameNormalized ? { nameNormalized: nextNameNormalized } : {}),
    ...(parsed.slug ? { slug: await resolveAvailableSlug(parsed.slug, roleId) } : {}),
  }

  const rows = await db
    .update(roleCatalog)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(and(eq(roleCatalog.id, roleId), isNull(roleCatalog.deletedAt)))
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Role not found")
  }

  return mapEntity(row)
}

export async function deleteRoleCatalog(roleId: string) {
  const deletedAt = new Date()

  const rows = await db
    .update(roleCatalog)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(and(eq(roleCatalog.id, roleId), isNull(roleCatalog.deletedAt)))
    .returning({ id: roleCatalog.id, deletedAt: roleCatalog.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Role not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}

export async function findRoleCatalogByName(name: string): Promise<RoleCatalogEntity | null> {
  const normalizedName = normalizeSearchText(name)

  const rows = await db
    .select()
    .from(roleCatalog)
    .where(and(eq(roleCatalog.nameNormalized, normalizedName), isNull(roleCatalog.deletedAt)))
    .limit(1)

  const row = rows[0]
  return row ? mapEntity(row) : null
}

export async function resolveRoleCatalogByName(name: string): Promise<RoleCatalogEntity> {
  const existing = await findRoleCatalogByName(name)

  if (existing) {
    return existing
  }

  return createRoleCatalog({
    name,
    slug: toSlug(name),
  })
}
