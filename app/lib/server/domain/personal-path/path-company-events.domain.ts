import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { pathCompanyEvents } from "@/app/lib/db/schema"
import {
  normalizePathCompanyEventType,
  pathCompanyEventTypeSchema,
} from "@/app/lib/models/common/domain-enums"
import type {
  PathCompanyEventsCreateInput,
  PathCompanyEventsEntity,
  PathCompanyEventsListParams,
  PathCompanyEventsListResponse,
  PathCompanyEventsUpdateInput,
} from "@/app/lib/models/personal-path/path-company-events.model"
import { ApiError } from "@/app/lib/server/api-error"
import { clampLimit, requirePatchPayload, toIso } from "@/app/lib/server/domain/common"
import { syncEndOfEmploymentEventForCompany } from "@/app/lib/server/domain/personal-path/end-of-employment-event-sync"
import { assertPathCompanyOwnership } from "@/app/lib/server/domain/personal-path/path-companies.domain"

const createSchema = z.object({
  eventType: pathCompanyEventTypeSchema,
  effectiveDate: z.coerce.date(),
  amount: z.number().min(0),
  notes: z.string().trim().max(1000).nullable().optional(),
})

const updateSchema = createSchema.partial()

function mapEntity(row: typeof pathCompanyEvents.$inferSelect): PathCompanyEventsEntity {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
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

async function getRecordOrThrow(ownerUserId: string, pathCompanyId: string, eventId: string) {
  await assertPathCompanyOwnership(ownerUserId, pathCompanyId)

  const rows = await db
    .select()
    .from(pathCompanyEvents)
    .where(
      and(
        eq(pathCompanyEvents.id, eventId),
        eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
        eq(pathCompanyEvents.ownerUserId, ownerUserId),
        isNull(pathCompanyEvents.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Path company event not found")
  }

  return row
}

export async function listPathCompanyEvents(
  ownerUserId: string,
  pathCompanyId: string,
  params: PathCompanyEventsListParams = {}
): Promise<PathCompanyEventsListResponse> {
  await assertPathCompanyOwnership(ownerUserId, pathCompanyId)

  const limit = clampLimit(params.limit)

  const rows = await db
    .select()
    .from(pathCompanyEvents)
    .where(
      and(
        eq(pathCompanyEvents.ownerUserId, ownerUserId),
        eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
        isNull(pathCompanyEvents.deletedAt)
      )
    )
    .orderBy(desc(pathCompanyEvents.effectiveDate))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function listPathCompanyEventsByOwner(
  ownerUserId: string,
  params: PathCompanyEventsListParams = {}
): Promise<PathCompanyEventsListResponse> {
  const limit = clampLimit(params.limit, 50, 100)

  const rows = await db
    .select()
    .from(pathCompanyEvents)
    .where(and(eq(pathCompanyEvents.ownerUserId, ownerUserId), isNull(pathCompanyEvents.deletedAt)))
    .orderBy(desc(pathCompanyEvents.effectiveDate))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getPathCompanyEventById(
  ownerUserId: string,
  pathCompanyId: string,
  eventId: string
): Promise<PathCompanyEventsEntity> {
  const row = await getRecordOrThrow(ownerUserId, pathCompanyId, eventId)
  return mapEntity(row)
}

export async function createPathCompanyEvent(
  ownerUserId: string,
  pathCompanyId: string,
  input: PathCompanyEventsCreateInput
): Promise<PathCompanyEventsEntity> {
  await assertPathCompanyOwnership(ownerUserId, pathCompanyId)

  const payload = createSchema.parse(input)
  const now = new Date()

  const row = await db.transaction(async (tx) => {
    const rows = await tx
      .insert(pathCompanyEvents)
      .values({
        id: crypto.randomUUID(),
        ownerUserId,
        pathCompanyId,
        eventType: payload.eventType,
        effectiveDate: payload.effectiveDate,
        amount: payload.amount,
        notes: payload.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const created = rows[0]

    if (!created) {
      throw new ApiError(500, "INTERNAL_ERROR", "Failed to create path company event")
    }

    await syncEndOfEmploymentEventForCompany(tx, {
      ownerUserId,
      pathCompanyId,
      now,
    })

    return created
  })

  return mapEntity(row)
}

export async function updatePathCompanyEvent(
  ownerUserId: string,
  pathCompanyId: string,
  eventId: string,
  input: PathCompanyEventsUpdateInput
): Promise<PathCompanyEventsEntity> {
  await assertPathCompanyOwnership(ownerUserId, pathCompanyId)

  const payload = requirePatchPayload(updateSchema.parse(input))
  const updatedAt = new Date()

  const row = await db.transaction(async (tx) => {
    const rows = await tx
      .update(pathCompanyEvents)
      .set({
        ...payload,
        updatedAt,
      })
      .where(
        and(
          eq(pathCompanyEvents.id, eventId),
          eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
          eq(pathCompanyEvents.ownerUserId, ownerUserId),
          isNull(pathCompanyEvents.deletedAt)
        )
      )
      .returning()

    const updated = rows[0]

    if (!updated) {
      return null
    }

    await syncEndOfEmploymentEventForCompany(tx, {
      ownerUserId,
      pathCompanyId,
      now: updatedAt,
    })

    return updated
  })

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Path company event not found")
  }

  return mapEntity(row)
}

export async function deletePathCompanyEvent(
  ownerUserId: string,
  pathCompanyId: string,
  eventId: string
) {
  await assertPathCompanyOwnership(ownerUserId, pathCompanyId)

  const deletedAt = new Date()

  const row = await db.transaction(async (tx) => {
    const rows = await tx
      .update(pathCompanyEvents)
      .set({
        deletedAt,
        updatedAt: deletedAt,
      })
      .where(
        and(
          eq(pathCompanyEvents.id, eventId),
          eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
          eq(pathCompanyEvents.ownerUserId, ownerUserId),
          isNull(pathCompanyEvents.deletedAt)
        )
      )
      .returning({ id: pathCompanyEvents.id, deletedAt: pathCompanyEvents.deletedAt })

    const deleted = rows[0]

    if (!deleted || !deleted.deletedAt) {
      return null
    }

    await syncEndOfEmploymentEventForCompany(tx, {
      ownerUserId,
      pathCompanyId,
      now: deletedAt,
    })

    return deleted
  })

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Path company event not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}
