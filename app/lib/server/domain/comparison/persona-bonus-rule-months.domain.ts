import { and, asc, eq, isNull } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/app/lib/db/client"
import { personaBonusRuleMonths } from "@/app/lib/db/schema"
import type {
  PersonaBonusRuleMonthsCreateInput,
  PersonaBonusRuleMonthsEntity,
  PersonaBonusRuleMonthsListParams,
  PersonaBonusRuleMonthsListResponse,
  PersonaBonusRuleMonthsUpdateInput,
} from "@/app/lib/models/comparison/persona-bonus-rule-months.model"
import { ApiError } from "@/app/lib/server/api-error"
import { clampLimit, requirePatchPayload, toIso } from "@/app/lib/server/domain/common"
import { assertBonusRuleOwnership } from "@/app/lib/server/domain/comparison/persona-bonus-rules.domain"

const createSchema = z.object({
  month: z.number().int().min(1).max(12),
})

const updateSchema = createSchema.partial()

function mapEntity(row: typeof personaBonusRuleMonths.$inferSelect): PersonaBonusRuleMonthsEntity {
  return {
    id: row.id,
    bonusRuleId: row.bonusRuleId,
    month: row.month,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIso(row.deletedAt),
  }
}

async function getRecordOrThrow(ruleId: string, monthId: string) {
  const rows = await db
    .select()
    .from(personaBonusRuleMonths)
    .where(
      and(
        eq(personaBonusRuleMonths.id, monthId),
        eq(personaBonusRuleMonths.bonusRuleId, ruleId),
        isNull(personaBonusRuleMonths.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Bonus rule month not found")
  }

  return row
}

export async function listPersonaBonusRuleMonths(
  ownerUserId: string,
  personaId: string,
  ruleId: string,
  params: PersonaBonusRuleMonthsListParams = {}
): Promise<PersonaBonusRuleMonthsListResponse> {
  await assertBonusRuleOwnership(ownerUserId, personaId, ruleId)

  const limit = clampLimit(params.limit)

  const rows = await db
    .select()
    .from(personaBonusRuleMonths)
    .where(
      and(
        eq(personaBonusRuleMonths.bonusRuleId, ruleId),
        isNull(personaBonusRuleMonths.deletedAt)
      )
    )
    .orderBy(asc(personaBonusRuleMonths.month))
    .limit(limit)

  return {
    items: rows.map(mapEntity),
    total: rows.length,
  }
}

export async function getPersonaBonusRuleMonthById(
  ownerUserId: string,
  personaId: string,
  ruleId: string,
  monthId: string
): Promise<PersonaBonusRuleMonthsEntity> {
  await assertBonusRuleOwnership(ownerUserId, personaId, ruleId)

  const row = await getRecordOrThrow(ruleId, monthId)
  return mapEntity(row)
}

export async function createPersonaBonusRuleMonth(
  ownerUserId: string,
  personaId: string,
  ruleId: string,
  input: PersonaBonusRuleMonthsCreateInput
): Promise<PersonaBonusRuleMonthsEntity> {
  await assertBonusRuleOwnership(ownerUserId, personaId, ruleId)

  const payload = createSchema.parse(input)
  const now = new Date()

  const rows = await db
    .insert(personaBonusRuleMonths)
    .values({
      id: crypto.randomUUID(),
      bonusRuleId: ruleId,
      month: payload.month,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create bonus rule month")
  }

  return mapEntity(row)
}

export async function updatePersonaBonusRuleMonth(
  ownerUserId: string,
  personaId: string,
  ruleId: string,
  monthId: string,
  input: PersonaBonusRuleMonthsUpdateInput
): Promise<PersonaBonusRuleMonthsEntity> {
  await assertBonusRuleOwnership(ownerUserId, personaId, ruleId)

  const payload = requirePatchPayload(updateSchema.parse(input))

  const rows = await db
    .update(personaBonusRuleMonths)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(personaBonusRuleMonths.id, monthId),
        eq(personaBonusRuleMonths.bonusRuleId, ruleId),
        isNull(personaBonusRuleMonths.deletedAt)
      )
    )
    .returning()

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Bonus rule month not found")
  }

  return mapEntity(row)
}

export async function deletePersonaBonusRuleMonth(
  ownerUserId: string,
  personaId: string,
  ruleId: string,
  monthId: string
) {
  await assertBonusRuleOwnership(ownerUserId, personaId, ruleId)

  const deletedAt = new Date()

  const rows = await db
    .update(personaBonusRuleMonths)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(
      and(
        eq(personaBonusRuleMonths.id, monthId),
        eq(personaBonusRuleMonths.bonusRuleId, ruleId),
        isNull(personaBonusRuleMonths.deletedAt)
      )
    )
    .returning({ id: personaBonusRuleMonths.id, deletedAt: personaBonusRuleMonths.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Bonus rule month not found")
  }

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}
