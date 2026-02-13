import { and, desc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { personaBonusRules } from "@/app/lib/db/schema"
import type {
  PersonaBonusRulesCreateInput,
  PersonaBonusRulesEntity,
  PersonaBonusRulesListParams,
  PersonaBonusRulesListResponse,
  PersonaBonusRulesUpdateInput,
} from "@/app/lib/models/comparison/persona-bonus-rules.model"
import { ApiError } from "@/app/lib/server/api-error"
import { clampLimit, requirePatchPayload, toIso } from "@/app/lib/server/domain/common"
import { assertPersonaOwnership } from "@/app/lib/server/domain/comparison/comparison-personas.domain"

const baseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  bonusType: z.string().trim().min(1).max(80),
  amount: z.number().min(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
})

const createSchema = baseSchema
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "endDate must be greater than or equal to startDate",
    path: ["endDate"],
  })

const updateSchema = baseSchema.partial().refine(
  (value) => {
    if (!value.startDate || !value.endDate) {
      return true
    }

    return value.endDate >= value.startDate
  },
  {
    message: "endDate must be greater than or equal to startDate",
    path: ["endDate"],
  }
)

function mapEntity(row: typeof personaBonusRules.$inferSelect): PersonaBonusRulesEntity {
  return {
    id: row.id,
    personaId: row.personaId,
    name: row.name,
    bonusType: row.bonusType,
    amount: row.amount,
    startDate: toIso(row.startDate) ?? new Date(0).toISOString(),
    endDate: toIso(row.endDate),
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function getRecordOrThrow(personaId: string, ruleId: string) {
  const rows = await db
    .select()
    .from(personaBonusRules)
    .where(
      and(
        eq(personaBonusRules.id, ruleId),
        eq(personaBonusRules.personaId, personaId),
        isNull(personaBonusRules.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Persona bonus rule not found")
  }

  return row
}

export async function assertBonusRuleOwnership(
  ownerUserId: string,
  personaId: string,
  ruleId: string
) {
  await assertPersonaOwnership(ownerUserId, personaId)
  return getRecordOrThrow(personaId, ruleId)
}

export async function listPersonaBonusRules(
  ownerUserId: string,
  personaId: string,
  params: PersonaBonusRulesListParams = {}
): Promise<PersonaBonusRulesListResponse> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const limit = clampLimit(params.limit)

  const rows = await db
    .select()
    .from(personaBonusRules)
    .where(and(eq(personaBonusRules.personaId, personaId), isNull(personaBonusRules.deletedAt)))
    .orderBy(desc(personaBonusRules.startDate))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getPersonaBonusRuleById(
  ownerUserId: string,
  personaId: string,
  ruleId: string
): Promise<PersonaBonusRulesEntity> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const row = await getRecordOrThrow(personaId, ruleId)
  return mapEntity(row)
}

export async function createPersonaBonusRule(
  ownerUserId: string,
  personaId: string,
  input: PersonaBonusRulesCreateInput
): Promise<PersonaBonusRulesEntity> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const payload = createSchema.parse(input)
  const now = new Date()

  const rows = await db
    .insert(personaBonusRules)
    .values({
      id: crypto.randomUUID(),
      personaId,
      name: payload.name,
      bonusType: payload.bonusType,
      amount: payload.amount,
      startDate: payload.startDate,
      endDate: payload.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create persona bonus rule")
  }

  return mapEntity(row)
}

export async function updatePersonaBonusRule(
  ownerUserId: string,
  personaId: string,
  ruleId: string,
  input: PersonaBonusRulesUpdateInput
): Promise<PersonaBonusRulesEntity> {
  await assertPersonaOwnership(ownerUserId, personaId)

  const payload = requirePatchPayload(updateSchema.parse(input))

  const rows = await db
    .update(personaBonusRules)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(personaBonusRules.id, ruleId),
        eq(personaBonusRules.personaId, personaId),
        isNull(personaBonusRules.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Persona bonus rule not found")
  }

  return mapEntity(row)
}

export async function deletePersonaBonusRule(
  ownerUserId: string,
  personaId: string,
  ruleId: string
) {
  await assertPersonaOwnership(ownerUserId, personaId)

  const deletedAt = new Date()

  const rows = await db
    .update(personaBonusRules)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(
      and(
        eq(personaBonusRules.id, ruleId),
        eq(personaBonusRules.personaId, personaId),
        isNull(personaBonusRules.deletedAt)
      )
    )
    .returning({ id: personaBonusRules.id, deletedAt: personaBonusRules.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Persona bonus rule not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}
