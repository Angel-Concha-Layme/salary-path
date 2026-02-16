import { and, desc, eq, isNull, lte, ne } from "drizzle-orm"

import { db } from "@/app/lib/db/client"
import { pathCompanies, pathCompanyEvents } from "@/app/lib/db/schema"

const END_OF_EMPLOYMENT_EVENT_TYPE = "end_of_employment" as const

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

interface SyncEndOfEmploymentEventInput {
  ownerUserId: string
  pathCompanyId: string
  endDate: Date
  now: Date
}

interface EndOfEmploymentEventIdentity {
  ownerUserId: string
  pathCompanyId: string
  now: Date
}

async function findActiveEndOfEmploymentEvent(
  tx: DbTx,
  ownerUserId: string,
  pathCompanyId: string
) {
  const rows = await tx
    .select({
      id: pathCompanyEvents.id,
    })
    .from(pathCompanyEvents)
    .where(
      and(
        eq(pathCompanyEvents.ownerUserId, ownerUserId),
        eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
        eq(pathCompanyEvents.eventType, END_OF_EMPLOYMENT_EVENT_TYPE),
        isNull(pathCompanyEvents.deletedAt)
      )
    )
    .orderBy(
      desc(pathCompanyEvents.effectiveDate),
      desc(pathCompanyEvents.updatedAt),
      desc(pathCompanyEvents.createdAt),
      desc(pathCompanyEvents.id)
    )
    .limit(1)

  return rows[0] ?? null
}

async function resolveLatestRateAmount(
  tx: DbTx,
  ownerUserId: string,
  pathCompanyId: string,
  endDate: Date
): Promise<number | null> {
  const onOrBeforeEndDateRows = await tx
    .select({
      amount: pathCompanyEvents.amount,
    })
    .from(pathCompanyEvents)
    .where(
      and(
        eq(pathCompanyEvents.ownerUserId, ownerUserId),
        eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
        ne(pathCompanyEvents.eventType, END_OF_EMPLOYMENT_EVENT_TYPE),
        isNull(pathCompanyEvents.deletedAt),
        lte(pathCompanyEvents.effectiveDate, endDate)
      )
    )
    .orderBy(
      desc(pathCompanyEvents.effectiveDate),
      desc(pathCompanyEvents.updatedAt),
      desc(pathCompanyEvents.createdAt),
      desc(pathCompanyEvents.id)
    )
    .limit(1)

  if (onOrBeforeEndDateRows[0]) {
    return onOrBeforeEndDateRows[0].amount
  }

  const latestRows = await tx
    .select({
      amount: pathCompanyEvents.amount,
    })
    .from(pathCompanyEvents)
    .where(
      and(
        eq(pathCompanyEvents.ownerUserId, ownerUserId),
        eq(pathCompanyEvents.pathCompanyId, pathCompanyId),
        ne(pathCompanyEvents.eventType, END_OF_EMPLOYMENT_EVENT_TYPE),
        isNull(pathCompanyEvents.deletedAt)
      )
    )
    .orderBy(
      desc(pathCompanyEvents.effectiveDate),
      desc(pathCompanyEvents.updatedAt),
      desc(pathCompanyEvents.createdAt),
      desc(pathCompanyEvents.id)
    )
    .limit(1)

  return latestRows[0]?.amount ?? null
}

export async function clearEndOfEmploymentEvents(
  tx: DbTx,
  input: EndOfEmploymentEventIdentity
) {
  await tx
    .update(pathCompanyEvents)
    .set({
      deletedAt: input.now,
      updatedAt: input.now,
    })
    .where(
      and(
        eq(pathCompanyEvents.ownerUserId, input.ownerUserId),
        eq(pathCompanyEvents.pathCompanyId, input.pathCompanyId),
        eq(pathCompanyEvents.eventType, END_OF_EMPLOYMENT_EVENT_TYPE),
        isNull(pathCompanyEvents.deletedAt)
      )
    )
}

export async function syncEndOfEmploymentEvent(
  tx: DbTx,
  input: SyncEndOfEmploymentEventInput
) {
  const latestAmount = await resolveLatestRateAmount(
    tx,
    input.ownerUserId,
    input.pathCompanyId,
    input.endDate
  )

  const existingEvent = await findActiveEndOfEmploymentEvent(
    tx,
    input.ownerUserId,
    input.pathCompanyId
  )

  if (latestAmount === null) {
    if (existingEvent) {
      await tx
        .update(pathCompanyEvents)
        .set({
          deletedAt: input.now,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(pathCompanyEvents.id, existingEvent.id),
            eq(pathCompanyEvents.ownerUserId, input.ownerUserId),
            eq(pathCompanyEvents.pathCompanyId, input.pathCompanyId),
            isNull(pathCompanyEvents.deletedAt)
          )
        )
    }

    return
  }

  if (existingEvent) {
    await tx
      .update(pathCompanyEvents)
      .set({
        effectiveDate: input.endDate,
        amount: latestAmount,
        updatedAt: input.now,
      })
      .where(
        and(
          eq(pathCompanyEvents.id, existingEvent.id),
          eq(pathCompanyEvents.ownerUserId, input.ownerUserId),
          eq(pathCompanyEvents.pathCompanyId, input.pathCompanyId),
          isNull(pathCompanyEvents.deletedAt)
        )
      )

    return
  }

  await tx.insert(pathCompanyEvents).values({
    id: crypto.randomUUID(),
    ownerUserId: input.ownerUserId,
    pathCompanyId: input.pathCompanyId,
    eventType: END_OF_EMPLOYMENT_EVENT_TYPE,
    effectiveDate: input.endDate,
    amount: latestAmount,
    notes: null,
    createdAt: input.now,
    updatedAt: input.now,
    deletedAt: null,
  })
}

export async function syncEndOfEmploymentEventForCompany(
  tx: DbTx,
  input: EndOfEmploymentEventIdentity
) {
  const rows = await tx
    .select({
      endDate: pathCompanies.endDate,
    })
    .from(pathCompanies)
    .where(
      and(
        eq(pathCompanies.id, input.pathCompanyId),
        eq(pathCompanies.ownerUserId, input.ownerUserId),
        isNull(pathCompanies.deletedAt)
      )
    )
    .limit(1)

  const endDate = rows[0]?.endDate ?? null

  if (!endDate) {
    return
  }

  await syncEndOfEmploymentEvent(tx, {
    ownerUserId: input.ownerUserId,
    pathCompanyId: input.pathCompanyId,
    endDate,
    now: input.now,
  })
}
