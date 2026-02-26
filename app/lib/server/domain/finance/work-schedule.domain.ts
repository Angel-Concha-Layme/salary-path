import { and, eq, inArray, isNull } from "drizzle-orm"

import { db } from "@/app/lib/db/client"
import { pathCompanyWorkScheduleDays, userWorkScheduleDays } from "@/app/lib/db/schema"
import {
  buildDefaultWorkSchedule,
  normalizeWorkSchedule,
  type WorkScheduleDayOfWeek,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type DbExecutor = typeof db | DbTx

function mapRowsToWorkSchedule(
  rows: Array<{
    dayOfWeek: number
    isWorkingDay: number
    startMinute: number | null
    endMinute: number | null
    breakMinute: number | null
  }>
): WorkSchedule {
  return normalizeWorkSchedule(
    rows.map((row) => ({
      dayOfWeek: row.dayOfWeek as WorkScheduleDayOfWeek,
      isWorkingDay: Boolean(row.isWorkingDay),
      startMinute: row.startMinute,
      endMinute: row.endMinute,
      breakMinute: row.breakMinute,
    }))
  )
}

export async function listUserWorkScheduleDays(
  ownerUserId: string,
  executor: DbExecutor = db
): Promise<WorkSchedule | null> {
  const rows = await executor
    .select({
      dayOfWeek: userWorkScheduleDays.dayOfWeek,
      isWorkingDay: userWorkScheduleDays.isWorkingDay,
      startMinute: userWorkScheduleDays.startMinute,
      endMinute: userWorkScheduleDays.endMinute,
      breakMinute: userWorkScheduleDays.breakMinute,
    })
    .from(userWorkScheduleDays)
    .where(
      and(
        eq(userWorkScheduleDays.ownerUserId, ownerUserId),
        isNull(userWorkScheduleDays.deletedAt)
      )
    )

  if (rows.length === 0) {
    return null
  }

  return mapRowsToWorkSchedule(rows)
}

export async function resolveUserWorkSchedule(
  ownerUserId: string,
  executor: DbExecutor = db
): Promise<WorkSchedule> {
  const schedule = await listUserWorkScheduleDays(ownerUserId, executor)
  return schedule ?? buildDefaultWorkSchedule()
}

export async function replaceUserWorkScheduleDays(
  ownerUserId: string,
  schedule: WorkSchedule,
  now: Date,
  executor: DbExecutor = db
) {
  const normalized = normalizeWorkSchedule(schedule)

  await executor
    .update(userWorkScheduleDays)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(userWorkScheduleDays.ownerUserId, ownerUserId),
        isNull(userWorkScheduleDays.deletedAt)
      )
    )

  await executor.insert(userWorkScheduleDays).values(
    normalized.map((day) => ({
      id: crypto.randomUUID(),
      ownerUserId,
      dayOfWeek: day.dayOfWeek,
      isWorkingDay: day.isWorkingDay ? 1 : 0,
      startMinute: day.startMinute,
      endMinute: day.endMinute,
      breakMinute: day.breakMinute,
      createdAt: now,
      updatedAt: now,
    }))
  )
}

export async function listPathCompanyWorkScheduleDays(
  pathCompanyIds: string[],
  executor: DbExecutor = db
): Promise<Map<string, WorkSchedule>> {
  if (pathCompanyIds.length === 0) {
    return new Map()
  }

  const rows = await executor
    .select({
      pathCompanyId: pathCompanyWorkScheduleDays.pathCompanyId,
      dayOfWeek: pathCompanyWorkScheduleDays.dayOfWeek,
      isWorkingDay: pathCompanyWorkScheduleDays.isWorkingDay,
      startMinute: pathCompanyWorkScheduleDays.startMinute,
      endMinute: pathCompanyWorkScheduleDays.endMinute,
      breakMinute: pathCompanyWorkScheduleDays.breakMinute,
    })
    .from(pathCompanyWorkScheduleDays)
    .where(
      and(
        inArray(pathCompanyWorkScheduleDays.pathCompanyId, pathCompanyIds),
        isNull(pathCompanyWorkScheduleDays.deletedAt)
      )
    )

  const byCompany = new Map<string, Array<{
    dayOfWeek: number
    isWorkingDay: number
    startMinute: number | null
    endMinute: number | null
    breakMinute: number | null
  }>>()

  rows.forEach((row) => {
    const current = byCompany.get(row.pathCompanyId) ?? []
    current.push({
      dayOfWeek: row.dayOfWeek as WorkScheduleDayOfWeek,
      isWorkingDay: row.isWorkingDay,
      startMinute: row.startMinute,
      endMinute: row.endMinute,
      breakMinute: row.breakMinute,
    })
    byCompany.set(row.pathCompanyId, current)
  })

  const result = new Map<string, WorkSchedule>()

  byCompany.forEach((companyRows, pathCompanyId) => {
    result.set(pathCompanyId, mapRowsToWorkSchedule(companyRows))
  })

  return result
}

export async function replacePathCompanyWorkScheduleDays(
  pathCompanyId: string,
  schedule: WorkSchedule,
  now: Date,
  executor: DbExecutor = db
) {
  const normalized = normalizeWorkSchedule(schedule)

  await executor
    .update(pathCompanyWorkScheduleDays)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(pathCompanyWorkScheduleDays.pathCompanyId, pathCompanyId),
        isNull(pathCompanyWorkScheduleDays.deletedAt)
      )
    )

  await executor.insert(pathCompanyWorkScheduleDays).values(
    normalized.map((day) => ({
      id: crypto.randomUUID(),
      pathCompanyId,
      dayOfWeek: day.dayOfWeek,
      isWorkingDay: day.isWorkingDay ? 1 : 0,
      startMinute: day.startMinute,
      endMinute: day.endMinute,
      breakMinute: day.breakMinute,
      createdAt: now,
      updatedAt: now,
    }))
  )
}

export async function clearPathCompanyWorkScheduleDays(
  pathCompanyId: string,
  now: Date,
  executor: DbExecutor = db
) {
  await executor
    .update(pathCompanyWorkScheduleDays)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(pathCompanyWorkScheduleDays.pathCompanyId, pathCompanyId),
        isNull(pathCompanyWorkScheduleDays.deletedAt)
      )
    )
}
