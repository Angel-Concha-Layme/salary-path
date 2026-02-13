import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { personaCareerEvents } from "@/app/lib/db/schema"
import type {
  PersonaCareerEventsCreateInput,
  PersonaCareerEventsEntity,
  PersonaCareerEventsListParams,
  PersonaCareerEventsListResponse,
  PersonaCareerEventsUpdateInput,
} from "@/app/lib/models/comparison/persona-career-events.model"
import { ApiError } from "@/app/lib/server/api-error"
import { clampLimit, requirePatchPayload, toIso } from "@/app/lib/server/domain/common"
import { assertPersonaOwnership } from "@/app/lib/server/domain/comparison/comparison-personas.domain"

const createSchema = z.object({
  eventDate: z.coerce.date(),
  title: z.string().trim().min(1).max(160),
  salaryAmount: z.number().min(0),
  rateAmount: z.number().min(0).nullable().optional(),
})

const updateSchema = createSchema.partial()

function mapEntity(row: typeof personaCareerEvents.$inferSelect): PersonaCareerEventsEntity {
  return {
    id: row.id,
    personaId: row.personaId,
    eventDate: toIso(row.eventDate) ?? new Date(0).toISOString(),
    title: row.title,
    salaryAmount: row.salaryAmount,
    rateAmount: row.rateAmount,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function getRecordOrThrow(personaId: string, eventId: string) {
  const rows = await db
    .select()
    .from(personaCareerEvents)
    .where(
      and(
        eq(personaCareerEvents.id, eventId),
        eq(personaCareerEvents.personaId, personaId),
        isNull(personaCareerEvents.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Persona career event not found")
  }

  return row
}

export async function listPersonaCareerEvents(
  ownerUserId: string,
  personaId: string,
  params: PersonaCareerEventsListParams = {}
): Promise<PersonaCareerEventsListResponse> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const limit = clampLimit(params.limit)

  const rows = await db
    .select()
    .from(personaCareerEvents)
    .where(and(eq(personaCareerEvents.personaId, personaId), isNull(personaCareerEvents.deletedAt)))
    .orderBy(desc(personaCareerEvents.eventDate))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getPersonaCareerEventById(
  ownerUserId: string,
  personaId: string,
  eventId: string
): Promise<PersonaCareerEventsEntity> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const row = await getRecordOrThrow(personaId, eventId)
  return mapEntity(row)
}

export async function createPersonaCareerEvent(
  ownerUserId: string,
  personaId: string,
  input: PersonaCareerEventsCreateInput
): Promise<PersonaCareerEventsEntity> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const payload = createSchema.parse(input)
  const now = new Date()

  const rows = await db
    .insert(personaCareerEvents)
    .values({
      id: crypto.randomUUID(),
      personaId,
      eventDate: payload.eventDate,
      title: payload.title,
      salaryAmount: payload.salaryAmount,
      rateAmount: payload.rateAmount ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create persona career event")
  }

  return mapEntity(row)
}

export async function updatePersonaCareerEvent(
  ownerUserId: string,
  personaId: string,
  eventId: string,
  input: PersonaCareerEventsUpdateInput
): Promise<PersonaCareerEventsEntity> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const payload = requirePatchPayload(updateSchema.parse(input))

  const rows = await db
    .update(personaCareerEvents)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(personaCareerEvents.id, eventId),
        eq(personaCareerEvents.personaId, personaId),
        isNull(personaCareerEvents.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Persona career event not found")
  }

  return mapEntity(row)
}

export async function deletePersonaCareerEvent(
  ownerUserId: string,
  personaId: string,
  eventId: string
) {
  await assertPersonaOwnership(ownerUserId, personaId)

  const deletedAt = new Date()

  const rows = await db
    .update(personaCareerEvents)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(
      and(
        eq(personaCareerEvents.id, eventId),
        eq(personaCareerEvents.personaId, personaId),
        isNull(personaCareerEvents.deletedAt)
      )
    )
    .returning({ id: personaCareerEvents.id, deletedAt: personaCareerEvents.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Persona career event not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}
