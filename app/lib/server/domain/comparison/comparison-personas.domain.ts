import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { comparisonPersonas } from "@/app/lib/db/schema"
import type {
  ComparisonPersonasCreateInput,
  ComparisonPersonasEntity,
  ComparisonPersonasListParams,
  ComparisonPersonasListResponse,
  ComparisonPersonasUpdateInput,
} from "@/app/lib/models/comparison/comparison-personas.model"
import { ApiError } from "@/app/lib/server/api-error"
import { clampLimit, requirePatchPayload, toIso } from "@/app/lib/server/domain/common"

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  title: z.string().trim().max(160).nullable().optional(),
})

const updateSchema = createSchema.partial()

function mapEntity(row: typeof comparisonPersonas.$inferSelect): ComparisonPersonasEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    title: row.title,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function getRecordOrThrow(ownerUserId: string, personaId: string) {
  const rows = await db
    .select()
    .from(comparisonPersonas)
    .where(
      and(
        eq(comparisonPersonas.id, personaId),
        eq(comparisonPersonas.ownerUserId, ownerUserId),
        isNull(comparisonPersonas.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Persona not found")
  }

  return row
}

export async function assertPersonaOwnership(ownerUserId: string, personaId: string) {
  return getRecordOrThrow(ownerUserId, personaId)
}

export async function listComparisonPersonas(
  ownerUserId: string,
  params: ComparisonPersonasListParams = {}
): Promise<ComparisonPersonasListResponse> {
  const limit = clampLimit(params.limit)

  const rows = await db
    .select()
    .from(comparisonPersonas)
    .where(and(eq(comparisonPersonas.ownerUserId, ownerUserId), isNull(comparisonPersonas.deletedAt)))
    .orderBy(desc(comparisonPersonas.createdAt))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getComparisonPersonaById(
  ownerUserId: string,
  personaId: string
): Promise<ComparisonPersonasEntity> {
  const row = await getRecordOrThrow(ownerUserId, personaId)
  return mapEntity(row)
}

export async function createComparisonPersona(
  ownerUserId: string,
  input: ComparisonPersonasCreateInput
): Promise<ComparisonPersonasEntity> {
  const payload = createSchema.parse(input)
  const now = new Date()

  const rows = await db
    .insert(comparisonPersonas)
    .values({
      id: crypto.randomUUID(),
      ownerUserId,
      name: payload.name,
      title: payload.title ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create persona")
  }

  return mapEntity(row)
}

export async function updateComparisonPersona(
  ownerUserId: string,
  personaId: string,
  input: ComparisonPersonasUpdateInput
): Promise<ComparisonPersonasEntity> {
  const payload = requirePatchPayload(updateSchema.parse(input))

  const rows = await db
    .update(comparisonPersonas)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(comparisonPersonas.id, personaId),
        eq(comparisonPersonas.ownerUserId, ownerUserId),
        isNull(comparisonPersonas.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Persona not found")
  }

  return mapEntity(row)
}

export async function deleteComparisonPersona(ownerUserId: string, personaId: string) {
  const deletedAt = new Date()

  const rows = await db
    .update(comparisonPersonas)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(
      and(
        eq(comparisonPersonas.id, personaId),
        eq(comparisonPersonas.ownerUserId, ownerUserId),
        isNull(comparisonPersonas.deletedAt)
      )
    )
    .returning({ id: comparisonPersonas.id, deletedAt: comparisonPersonas.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Persona not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}
