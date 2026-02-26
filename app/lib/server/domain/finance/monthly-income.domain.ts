import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
} from "drizzle-orm"

import { db } from "@/app/lib/db/client"
import {
  pathCompanies,
  pathCompanyEvents,
  userMonthlyIncomeSnapshots,
  userMonthlyIncomeSources,
} from "@/app/lib/db/schema"
import {
  monthlyIncomeRangePresetSchema,
  monthlyIncomeSourceCreateSchema,
  monthlyIncomeSourceUpdateSchema,
  type MonthlyIncomeCurrencyBucket,
  type MonthlyIncomeListResponse,
  type MonthlyIncomeRangePreset,
  type MonthlyIncomeSource,
  type MonthlyIncomeSourceCreateInput,
  type MonthlyIncomeSourceDeleteResponse,
  type MonthlyIncomeSourceType,
  type MonthlyIncomeSourceUpdateInput,
} from "@/app/lib/models/finance/monthly-income.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import {
  normalizeWorkSchedule,
  resolveWorkScheduleDayMinutes,
  type WorkScheduleDayOfWeek,
  type WorkSchedule,
} from "@/app/lib/models/work-schedule/work-schedule.model"
import { ApiError } from "@/app/lib/server/api-error"
import {
  listPathCompanyWorkScheduleDays,
  resolveUserWorkSchedule,
} from "@/app/lib/server/domain/finance/work-schedule.domain"
import { toIso } from "@/app/lib/server/domain/common"

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type DbExecutor = typeof db | DbTx

interface EngineCompany {
  id: string
  displayName: string
  compensationType: PathCompaniesEntity["compensationType"]
  currency: string
  startDate: Date
  endDate: Date | null
}

interface EngineEvent {
  pathCompanyId: string
  eventType: string
  effectiveDate: Date
  amount: number
}

interface EmploymentSourceEstimate {
  monthStart: Date
  currency: string
  pathCompanyId: string
  companyName: string
  computedAmount: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const EPSILON = 1e-7

function toUtcDateOnly(value: Date | string | number): Date {
  const parsed = new Date(value)

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

function toMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function monthStartFromKey(monthKey: string): Date {
  const [yearText, monthText] = monthKey.split("-")
  const year = Number(yearText)
  const month = Number(monthText)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid month format. Use YYYY-MM")
  }

  return new Date(Date.UTC(year, month - 1, 1))
}

function toMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7)
}

function monthEndExclusive(monthStart: Date): Date {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1))
}

function daysInMonth(monthStart: Date): number {
  return (monthEndExclusive(monthStart).getTime() - monthStart.getTime()) / DAY_MS
}

function iterateMonthStarts(startMonth: Date, endMonth: Date): Date[] {
  const result: Date[] = []
  let cursor = toMonthStart(startMonth)
  const safeEnd = toMonthStart(endMonth)

  while (cursor.getTime() <= safeEnd.getTime()) {
    result.push(cursor)
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  }

  return result
}

function toDow(date: Date): WorkScheduleDayOfWeek {
  return (((date.getUTCDay() + 6) % 7) + 1) as WorkScheduleDayOfWeek
}

function countWorkingHoursInRange(
  schedule: WorkSchedule,
  startInclusive: Date,
  endExclusive: Date
): number {
  if (startInclusive.getTime() >= endExclusive.getTime()) {
    return 0
  }

  const byDay = new Map(schedule.map((day) => [day.dayOfWeek, day]))
  let cursor = startInclusive
  let minutes = 0

  while (cursor.getTime() < endExclusive.getTime()) {
    const row = byDay.get(toDow(cursor))

    if (row) {
      minutes += resolveWorkScheduleDayMinutes(row)
    }

    cursor = addUtcDays(cursor, 1)
  }

  return minutes / 60
}

function resolveRateAtDate(events: EngineEvent[], targetDate: Date): number | null {
  const sorted = [...events].sort(
    (left, right) => left.effectiveDate.getTime() - right.effectiveDate.getTime()
  )
  let currentRate: number | null = null

  for (const event of sorted) {
    if (event.effectiveDate.getTime() > targetDate.getTime()) {
      break
    }

    currentRate = event.amount
  }

  return currentRate
}

function calculateEmploymentEstimateForMonth(input: {
  company: EngineCompany
  monthStart: Date
  monthEndExclusive: Date
  events: EngineEvent[]
  schedule: WorkSchedule
}): number {
  const activeStart = new Date(
    Math.max(input.monthStart.getTime(), input.company.startDate.getTime())
  )

  const companyEndExclusive = input.company.endDate
    ? addUtcDays(input.company.endDate, 1)
    : input.monthEndExclusive
  const activeEndExclusive = new Date(
    Math.min(input.monthEndExclusive.getTime(), companyEndExclusive.getTime())
  )

  if (activeStart.getTime() >= activeEndExclusive.getTime()) {
    return 0
  }

  const rateEvents = input.events
    .filter((event) => event.eventType !== "end_of_employment")
    .sort((left, right) => left.effectiveDate.getTime() - right.effectiveDate.getTime())

  if (rateEvents.length === 0) {
    return 0
  }

  const splitTimestamps = new Set<number>([
    activeStart.getTime(),
    activeEndExclusive.getTime(),
  ])

  rateEvents.forEach((event) => {
    const ts = event.effectiveDate.getTime()

    if (ts > activeStart.getTime() && ts < activeEndExclusive.getTime()) {
      splitTimestamps.add(ts)
    }
  })

  const splitPoints = Array.from(splitTimestamps)
    .sort((left, right) => left - right)
    .map((ts) => new Date(ts))

  let total = 0
  const monthTotalDays = daysInMonth(input.monthStart)

  for (let index = 0; index < splitPoints.length - 1; index += 1) {
    const segmentStart = splitPoints[index]
    const segmentEnd = splitPoints[index + 1]

    if (!segmentStart || !segmentEnd) {
      continue
    }

    const rate = resolveRateAtDate(rateEvents, segmentStart)

    if (rate === null) {
      continue
    }

    if (input.company.compensationType === "monthly") {
      const days = (segmentEnd.getTime() - segmentStart.getTime()) / DAY_MS
      total += (rate * days) / monthTotalDays
      continue
    }

    const hours = countWorkingHoursInRange(input.schedule, segmentStart, segmentEnd)
    total += rate * hours
  }

  return total
}

function resolveRangeStartMonth(range: MonthlyIncomeRangePreset, referenceDate: Date): Date | null {
  if (range === "all") {
    return null
  }

  const referenceMonth = toMonthStart(referenceDate)

  if (range === "ytd") {
    return new Date(Date.UTC(referenceMonth.getUTCFullYear(), 0, 1))
  }

  if (range === "last12m") {
    return new Date(
      Date.UTC(referenceMonth.getUTCFullYear(), referenceMonth.getUTCMonth() - 11, 1)
    )
  }

  return new Date(
    Date.UTC(referenceMonth.getUTCFullYear(), referenceMonth.getUTCMonth() - 35, 1)
  )
}

function mapSourceRowToEntity(row: {
  id: string
  monthStart: Date
  currency: string
  sourceType: string
  pathCompanyId: string | null
  companyNameSnapshot: string | null
  computedAmount: number
  finalAmount: number
  isUserEdited: number
  note: string | null
}): MonthlyIncomeSource {
  return {
    id: row.id,
    month: toMonthKey(toUtcDateOnly(row.monthStart)),
    currency: row.currency,
    sourceType: row.sourceType as MonthlyIncomeSourceType,
    pathCompanyId: row.pathCompanyId,
    companyName: row.companyNameSnapshot,
    computedAmount: row.computedAmount,
    finalAmount: row.finalAmount,
    isUserEdited: Boolean(row.isUserEdited),
    note: row.note,
  }
}

async function listCompaniesForOwner(ownerUserId: string, executor: DbExecutor): Promise<EngineCompany[]> {
  const rows = await executor
    .select({
      id: pathCompanies.id,
      displayName: pathCompanies.displayName,
      compensationType: pathCompanies.compensationType,
      currency: pathCompanies.currency,
      startDate: pathCompanies.startDate,
      endDate: pathCompanies.endDate,
    })
    .from(pathCompanies)
    .where(and(eq(pathCompanies.ownerUserId, ownerUserId), isNull(pathCompanies.deletedAt)))

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    compensationType:
      row.compensationType === "hourly" ? "hourly" : "monthly",
    currency: row.currency,
    startDate: toUtcDateOnly(row.startDate),
    endDate: row.endDate ? toUtcDateOnly(row.endDate) : null,
  }))
}

async function listEventsForOwner(ownerUserId: string, executor: DbExecutor): Promise<EngineEvent[]> {
  const rows = await executor
    .select({
      pathCompanyId: pathCompanyEvents.pathCompanyId,
      eventType: pathCompanyEvents.eventType,
      effectiveDate: pathCompanyEvents.effectiveDate,
      amount: pathCompanyEvents.amount,
    })
    .from(pathCompanyEvents)
    .innerJoin(pathCompanies, eq(pathCompanies.id, pathCompanyEvents.pathCompanyId))
    .where(
      and(
        eq(pathCompanies.ownerUserId, ownerUserId),
        isNull(pathCompanies.deletedAt),
        isNull(pathCompanyEvents.deletedAt)
      )
    )

  return rows.map((row) => ({
    pathCompanyId: row.pathCompanyId,
    eventType: row.eventType,
    effectiveDate: toUtcDateOnly(row.effectiveDate),
    amount: row.amount,
  }))
}

async function rebuildSnapshotsForMonthRange(
  ownerUserId: string,
  startMonth: Date,
  endMonth: Date,
  executor: DbExecutor = db
) {
  const [rows, snapshots] = await Promise.all([
    executor
      .select({
        id: userMonthlyIncomeSources.id,
        monthStart: userMonthlyIncomeSources.monthStart,
        currency: userMonthlyIncomeSources.currency,
        sourceType: userMonthlyIncomeSources.sourceType,
        computedAmount: userMonthlyIncomeSources.computedAmount,
        finalAmount: userMonthlyIncomeSources.finalAmount,
        isUserEdited: userMonthlyIncomeSources.isUserEdited,
      })
      .from(userMonthlyIncomeSources)
      .where(
        and(
          eq(userMonthlyIncomeSources.ownerUserId, ownerUserId),
          isNull(userMonthlyIncomeSources.deletedAt),
          gte(userMonthlyIncomeSources.monthStart, startMonth),
          lte(userMonthlyIncomeSources.monthStart, endMonth)
        )
      ),
    executor
      .select({
        id: userMonthlyIncomeSnapshots.id,
        monthStart: userMonthlyIncomeSnapshots.monthStart,
        currency: userMonthlyIncomeSnapshots.currency,
      })
      .from(userMonthlyIncomeSnapshots)
      .where(
        and(
          eq(userMonthlyIncomeSnapshots.ownerUserId, ownerUserId),
          isNull(userMonthlyIncomeSnapshots.deletedAt),
          gte(userMonthlyIncomeSnapshots.monthStart, startMonth),
          lte(userMonthlyIncomeSnapshots.monthStart, endMonth)
        )
      ),
  ])

  const grouped = new Map<string, MonthlyIncomeCurrencyBucket>()

  rows.forEach((row) => {
    const month = toUtcDateOnly(row.monthStart)
    const key = `${month.getTime()}|${row.currency}`
    const existing = grouped.get(key) ?? {
      month: toMonthKey(month),
      currency: row.currency,
      totals: {
        employmentComputed: 0,
        employmentFinal: 0,
        bonus: 0,
        extraIncome: 0,
        adjustment: 0,
        final: 0,
        isAdjusted: false,
      },
      sources: [],
    }

    if (row.sourceType === "employment") {
      existing.totals.employmentComputed += row.computedAmount
      existing.totals.employmentFinal += row.finalAmount
      if (row.isUserEdited) {
        existing.totals.isAdjusted = true
      }
    } else if (row.sourceType === "bonus") {
      existing.totals.bonus += row.finalAmount
    } else if (row.sourceType === "extra_income") {
      existing.totals.extraIncome += row.finalAmount
    } else if (row.sourceType === "adjustment") {
      existing.totals.adjustment += row.finalAmount
      if (Math.abs(row.finalAmount) > EPSILON) {
        existing.totals.isAdjusted = true
      }
    }

    grouped.set(key, existing)
  })

  grouped.forEach((bucket) => {
    bucket.totals.final =
      bucket.totals.employmentFinal +
      bucket.totals.bonus +
      bucket.totals.extraIncome +
      bucket.totals.adjustment
  })

  const now = new Date()
  const snapshotIds = snapshots.map((row) => row.id)

  const allSnapshotRows: Array<typeof userMonthlyIncomeSnapshots.$inferInsert> = []

  for (const [, bucket] of grouped.entries()) {
    const monthStart = monthStartFromKey(bucket.month)

    allSnapshotRows.push({
      id: crypto.randomUUID(),
      ownerUserId,
      monthStart,
      currency: bucket.currency,
      employmentComputedTotal: bucket.totals.employmentComputed,
      employmentFinalTotal: bucket.totals.employmentFinal,
      bonusTotal: bucket.totals.bonus,
      extraIncomeTotal: bucket.totals.extraIncome,
      adjustmentTotal: bucket.totals.adjustment,
      finalTotal: bucket.totals.final,
      isAdjusted: bucket.totals.isAdjusted ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    })
  }

  if (snapshotIds.length > 0) {
    await executor
      .update(userMonthlyIncomeSnapshots)
      .set({ deletedAt: now, updatedAt: now })
      .where(inArray(userMonthlyIncomeSnapshots.id, snapshotIds))
  }

  if (allSnapshotRows.length > 0) {
    await executor.insert(userMonthlyIncomeSnapshots).values(allSnapshotRows)
  }
}

export async function recomputeMonthlyIncomeLedgerFromDate(
  ownerUserId: string,
  fromDate: Date,
  executor: DbExecutor = db
) {
  const fromMonth = toMonthStart(fromDate)
  const currentMonth = toMonthStart(new Date())

  if (fromMonth.getTime() > currentMonth.getTime()) {
    return
  }

  const [companies, events, userScheduleRaw, existingEmploymentSources] = await Promise.all([
    listCompaniesForOwner(ownerUserId, executor),
    listEventsForOwner(ownerUserId, executor),
    resolveUserWorkSchedule(ownerUserId, executor),
    executor
      .select({
        id: userMonthlyIncomeSources.id,
        monthStart: userMonthlyIncomeSources.monthStart,
        currency: userMonthlyIncomeSources.currency,
        pathCompanyId: userMonthlyIncomeSources.pathCompanyId,
        finalAmount: userMonthlyIncomeSources.finalAmount,
        computedAmount: userMonthlyIncomeSources.computedAmount,
        isUserEdited: userMonthlyIncomeSources.isUserEdited,
        note: userMonthlyIncomeSources.note,
      })
      .from(userMonthlyIncomeSources)
      .where(
        and(
          eq(userMonthlyIncomeSources.ownerUserId, ownerUserId),
          eq(userMonthlyIncomeSources.sourceType, "employment"),
          isNull(userMonthlyIncomeSources.deletedAt),
          gte(userMonthlyIncomeSources.monthStart, fromMonth),
          lte(userMonthlyIncomeSources.monthStart, currentMonth)
        )
      ),
  ])

  if (companies.length === 0) {
    const now = new Date()

    const existingIds = existingEmploymentSources.map((row) => row.id)

    if (existingIds.length > 0) {
      await executor
        .update(userMonthlyIncomeSources)
        .set({ deletedAt: now, updatedAt: now })
        .where(inArray(userMonthlyIncomeSources.id, existingIds))
    }

    await rebuildSnapshotsForMonthRange(ownerUserId, fromMonth, currentMonth, executor)
    return
  }

  const eventsByCompany = new Map<string, EngineEvent[]>()

  events.forEach((event) => {
    const current = eventsByCompany.get(event.pathCompanyId) ?? []
    current.push(event)
    eventsByCompany.set(event.pathCompanyId, current)
  })

  const userSchedule = normalizeWorkSchedule(userScheduleRaw)
  const companyScheduleMap = await listPathCompanyWorkScheduleDays(
    companies.map((company) => company.id),
    executor
  )

  const monthStarts = iterateMonthStarts(fromMonth, currentMonth)

  const employmentByKey = new Map<string, (typeof existingEmploymentSources)[number]>(
    existingEmploymentSources.map((row) => {
      const month = toUtcDateOnly(row.monthStart)
      return [
        `${month.getTime()}|${row.currency}|${row.pathCompanyId ?? ""}`,
        row,
      ] as const
    })
  )

  const computedSources: EmploymentSourceEstimate[] = []

  monthStarts.forEach((monthStart) => {
    const monthEnd = monthEndExclusive(monthStart)

    companies.forEach((company) => {
      const schedule =
        companyScheduleMap.get(company.id) ??
        userSchedule
      const estimate = calculateEmploymentEstimateForMonth({
        company,
        monthStart,
        monthEndExclusive: monthEnd,
        events: eventsByCompany.get(company.id) ?? [],
        schedule,
      })

      if (estimate <= EPSILON) {
        return
      }

      computedSources.push({
        monthStart,
        currency: company.currency,
        pathCompanyId: company.id,
        companyName: company.displayName,
        computedAmount: estimate,
      })
    })
  })

  const now = new Date()
  const allRowsToInsert: Array<typeof userMonthlyIncomeSources.$inferInsert> = []

  for (const source of computedSources) {
    const key = `${source.monthStart.getTime()}|${source.currency}|${source.pathCompanyId}`
    const existing = employmentByKey.get(key)

    const nextFinal = existing?.isUserEdited
      ? existing.finalAmount
      : source.computedAmount

    allRowsToInsert.push({
      id: crypto.randomUUID(),
      ownerUserId,
      monthStart: source.monthStart,
      currency: source.currency,
      sourceType: "employment",
      pathCompanyId: source.pathCompanyId,
      companyNameSnapshot: source.companyName,
      computedAmount: source.computedAmount,
      finalAmount: nextFinal,
      isUserEdited:
        existing?.isUserEdited && Math.abs(nextFinal - source.computedAmount) > EPSILON
          ? 1
          : 0,
      note: existing?.note ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  const existingIds = existingEmploymentSources.map((row) => row.id)

  if (existingIds.length > 0) {
    await executor
      .update(userMonthlyIncomeSources)
      .set({ deletedAt: now, updatedAt: now })
      .where(inArray(userMonthlyIncomeSources.id, existingIds))
  }

  if (allRowsToInsert.length > 0) {
    await executor.insert(userMonthlyIncomeSources).values(allRowsToInsert)
  }

  await rebuildSnapshotsForMonthRange(ownerUserId, fromMonth, currentMonth, executor)
}

async function rebuildSnapshotsForSingleMonth(
  ownerUserId: string,
  monthStart: Date,
  executor: DbExecutor = db
) {
  await rebuildSnapshotsForMonthRange(ownerUserId, monthStart, monthStart, executor)
}

function monthWarningRequired(monthStart: Date): boolean {
  const nowMonth = toMonthStart(new Date())
  const previousMonth = new Date(Date.UTC(nowMonth.getUTCFullYear(), nowMonth.getUTCMonth() - 1, 1))

  return monthStart.getTime() < previousMonth.getTime()
}

export async function listMonthlyIncomeByRange(
  ownerUserId: string,
  rangeInput: string | undefined
): Promise<MonthlyIncomeListResponse> {
  const range = monthlyIncomeRangePresetSchema.parse(rangeInput ?? "all")
  const referenceDate = new Date()
  const rangeStartMonth = resolveRangeStartMonth(range, referenceDate)

  const snapshots = await db
    .select({
      monthStart: userMonthlyIncomeSnapshots.monthStart,
      currency: userMonthlyIncomeSnapshots.currency,
      employmentComputedTotal: userMonthlyIncomeSnapshots.employmentComputedTotal,
      employmentFinalTotal: userMonthlyIncomeSnapshots.employmentFinalTotal,
      bonusTotal: userMonthlyIncomeSnapshots.bonusTotal,
      extraIncomeTotal: userMonthlyIncomeSnapshots.extraIncomeTotal,
      adjustmentTotal: userMonthlyIncomeSnapshots.adjustmentTotal,
      finalTotal: userMonthlyIncomeSnapshots.finalTotal,
      isAdjusted: userMonthlyIncomeSnapshots.isAdjusted,
    })
    .from(userMonthlyIncomeSnapshots)
    .where(
      and(
        eq(userMonthlyIncomeSnapshots.ownerUserId, ownerUserId),
        isNull(userMonthlyIncomeSnapshots.deletedAt),
        ...(rangeStartMonth
          ? [gte(userMonthlyIncomeSnapshots.monthStart, rangeStartMonth)]
          : [])
      )
    )
    .orderBy(desc(userMonthlyIncomeSnapshots.monthStart), asc(userMonthlyIncomeSnapshots.currency))

  const sources = await db
    .select({
      id: userMonthlyIncomeSources.id,
      monthStart: userMonthlyIncomeSources.monthStart,
      currency: userMonthlyIncomeSources.currency,
      sourceType: userMonthlyIncomeSources.sourceType,
      pathCompanyId: userMonthlyIncomeSources.pathCompanyId,
      companyNameSnapshot: userMonthlyIncomeSources.companyNameSnapshot,
      computedAmount: userMonthlyIncomeSources.computedAmount,
      finalAmount: userMonthlyIncomeSources.finalAmount,
      isUserEdited: userMonthlyIncomeSources.isUserEdited,
      note: userMonthlyIncomeSources.note,
    })
    .from(userMonthlyIncomeSources)
    .where(
      and(
        eq(userMonthlyIncomeSources.ownerUserId, ownerUserId),
        isNull(userMonthlyIncomeSources.deletedAt),
        ...(rangeStartMonth
          ? [gte(userMonthlyIncomeSources.monthStart, rangeStartMonth)]
          : [])
      )
    )
    .orderBy(
      desc(userMonthlyIncomeSources.monthStart),
      asc(userMonthlyIncomeSources.currency),
      asc(userMonthlyIncomeSources.sourceType),
      asc(userMonthlyIncomeSources.companyNameSnapshot)
    )

  const bucketsByKey = new Map<string, MonthlyIncomeCurrencyBucket>()

  snapshots.forEach((snapshot) => {
    const month = toUtcDateOnly(snapshot.monthStart)
    const key = `${month.getTime()}|${snapshot.currency}`

    bucketsByKey.set(key, {
      month: toMonthKey(month),
      currency: snapshot.currency,
      totals: {
        employmentComputed: snapshot.employmentComputedTotal,
        employmentFinal: snapshot.employmentFinalTotal,
        bonus: snapshot.bonusTotal,
        extraIncome: snapshot.extraIncomeTotal,
        adjustment: snapshot.adjustmentTotal,
        final: snapshot.finalTotal,
        isAdjusted: Boolean(snapshot.isAdjusted),
      },
      sources: [],
    })
  })

  sources.forEach((source) => {
    const month = toUtcDateOnly(source.monthStart)
    const key = `${month.getTime()}|${source.currency}`
    const bucket = bucketsByKey.get(key)

    if (!bucket) {
      return
    }

    bucket.sources.push(mapSourceRowToEntity(source))
  })

  const items = Array.from(bucketsByKey.values()).sort((left, right) => {
    if (left.month === right.month) {
      return left.currency.localeCompare(right.currency)
    }

    return left.month < right.month ? 1 : -1
  })

  return {
    items,
    total: items.length,
  }
}

export async function createMonthlyIncomeSource(
  ownerUserId: string,
  input: MonthlyIncomeSourceCreateInput
): Promise<MonthlyIncomeSource> {
  const payload = monthlyIncomeSourceCreateSchema.parse(input)
  const monthStart = monthStartFromKey(payload.month)

  const rows = await db
    .insert(userMonthlyIncomeSources)
    .values({
      id: crypto.randomUUID(),
      ownerUserId,
      monthStart,
      currency: payload.currency,
      sourceType: payload.sourceType,
      pathCompanyId: null,
      companyNameSnapshot: null,
      computedAmount: payload.amount,
      finalAmount: payload.amount,
      isUserEdited: 1,
      note: payload.note ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: userMonthlyIncomeSources.id,
      monthStart: userMonthlyIncomeSources.monthStart,
      currency: userMonthlyIncomeSources.currency,
      sourceType: userMonthlyIncomeSources.sourceType,
      pathCompanyId: userMonthlyIncomeSources.pathCompanyId,
      companyNameSnapshot: userMonthlyIncomeSources.companyNameSnapshot,
      computedAmount: userMonthlyIncomeSources.computedAmount,
      finalAmount: userMonthlyIncomeSources.finalAmount,
      isUserEdited: userMonthlyIncomeSources.isUserEdited,
      note: userMonthlyIncomeSources.note,
    })

  const row = rows[0]

  if (!row) {
    throw new ApiError(500, "INTERNAL_ERROR", "Failed to create monthly income source")
  }

  await rebuildSnapshotsForSingleMonth(ownerUserId, monthStart)

  return mapSourceRowToEntity(row)
}

async function getMonthlyIncomeSourceOrThrow(ownerUserId: string, sourceId: string) {
  const rows = await db
    .select({
      id: userMonthlyIncomeSources.id,
      ownerUserId: userMonthlyIncomeSources.ownerUserId,
      monthStart: userMonthlyIncomeSources.monthStart,
      currency: userMonthlyIncomeSources.currency,
      sourceType: userMonthlyIncomeSources.sourceType,
      pathCompanyId: userMonthlyIncomeSources.pathCompanyId,
      companyNameSnapshot: userMonthlyIncomeSources.companyNameSnapshot,
      computedAmount: userMonthlyIncomeSources.computedAmount,
      finalAmount: userMonthlyIncomeSources.finalAmount,
      isUserEdited: userMonthlyIncomeSources.isUserEdited,
      note: userMonthlyIncomeSources.note,
      deletedAt: userMonthlyIncomeSources.deletedAt,
    })
    .from(userMonthlyIncomeSources)
    .where(
      and(
        eq(userMonthlyIncomeSources.id, sourceId),
        eq(userMonthlyIncomeSources.ownerUserId, ownerUserId),
        isNull(userMonthlyIncomeSources.deletedAt)
      )
    )
    .limit(1)

  const row = rows[0]

  if (!row) {
    throw new ApiError(404, "NOT_FOUND", "Monthly income source not found")
  }

  return row
}

export async function updateMonthlyIncomeSource(
  ownerUserId: string,
  sourceId: string,
  input: MonthlyIncomeSourceUpdateInput
): Promise<MonthlyIncomeSource> {
  const payload = monthlyIncomeSourceUpdateSchema.parse(input)
  const source = await getMonthlyIncomeSourceOrThrow(ownerUserId, sourceId)

  const nextValues: Partial<typeof userMonthlyIncomeSources.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (payload.note !== undefined) {
    nextValues.note = payload.note
  }

  if (source.sourceType === "employment") {
    if (payload.clearOverride) {
      nextValues.finalAmount = source.computedAmount
      nextValues.isUserEdited = 0
    } else if (payload.finalAmount !== undefined) {
      nextValues.finalAmount = payload.finalAmount
      nextValues.isUserEdited = Math.abs(payload.finalAmount - source.computedAmount) > EPSILON ? 1 : 0
    }
  } else if (payload.finalAmount !== undefined) {
    nextValues.finalAmount = payload.finalAmount
    nextValues.isUserEdited = 1
  }

  const updatedRows = await db
    .update(userMonthlyIncomeSources)
    .set(nextValues)
    .where(
      and(
        eq(userMonthlyIncomeSources.id, sourceId),
        eq(userMonthlyIncomeSources.ownerUserId, ownerUserId),
        isNull(userMonthlyIncomeSources.deletedAt)
      )
    )
    .returning({
      id: userMonthlyIncomeSources.id,
      monthStart: userMonthlyIncomeSources.monthStart,
      currency: userMonthlyIncomeSources.currency,
      sourceType: userMonthlyIncomeSources.sourceType,
      pathCompanyId: userMonthlyIncomeSources.pathCompanyId,
      companyNameSnapshot: userMonthlyIncomeSources.companyNameSnapshot,
      computedAmount: userMonthlyIncomeSources.computedAmount,
      finalAmount: userMonthlyIncomeSources.finalAmount,
      isUserEdited: userMonthlyIncomeSources.isUserEdited,
      note: userMonthlyIncomeSources.note,
    })

  const updated = updatedRows[0]

  if (!updated) {
    throw new ApiError(404, "NOT_FOUND", "Monthly income source not found")
  }

  await rebuildSnapshotsForSingleMonth(ownerUserId, toUtcDateOnly(source.monthStart))

  return mapSourceRowToEntity(updated)
}

export async function deleteMonthlyIncomeSource(
  ownerUserId: string,
  sourceId: string
): Promise<MonthlyIncomeSourceDeleteResponse> {
  const source = await getMonthlyIncomeSourceOrThrow(ownerUserId, sourceId)

  if (source.sourceType === "employment") {
    throw new ApiError(400, "VALIDATION_ERROR", "Employment monthly sources cannot be deleted")
  }

  const deletedAt = new Date()

  const rows = await db
    .update(userMonthlyIncomeSources)
    .set({
      deletedAt,
      updatedAt: deletedAt,
    })
    .where(
      and(
        eq(userMonthlyIncomeSources.id, sourceId),
        eq(userMonthlyIncomeSources.ownerUserId, ownerUserId),
        isNull(userMonthlyIncomeSources.deletedAt)
      )
    )
    .returning({ id: userMonthlyIncomeSources.id, deletedAt: userMonthlyIncomeSources.deletedAt })

  const row = rows[0]

  if (!row || !row.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Monthly income source not found")
  }

  await rebuildSnapshotsForSingleMonth(ownerUserId, toUtcDateOnly(source.monthStart))

  return {
    id: row.id,
    deletedAt: toIso(row.deletedAt) ?? deletedAt.toISOString(),
  }
}

export async function assertMonthlyEditWarning(
  ownerUserId: string,
  sourceId: string
): Promise<{ requiresWarning: boolean; month: string }> {
  const source = await getMonthlyIncomeSourceOrThrow(ownerUserId, sourceId)
  const monthStart = toUtcDateOnly(source.monthStart)

  return {
    requiresWarning: monthWarningRequired(monthStart),
    month: toMonthKey(monthStart),
  }
}

export async function recomputeMonthlyIncomeByAffectedCompanyDate(
  ownerUserId: string,
  pathCompanyIds: string[],
  fallbackDate: Date
) {
  if (pathCompanyIds.length === 0) {
    await recomputeMonthlyIncomeLedgerFromDate(ownerUserId, fallbackDate)
    return
  }

  const rows = await db
    .select({ effectiveDate: pathCompanyEvents.effectiveDate })
    .from(pathCompanyEvents)
    .where(
      and(
        inArray(pathCompanyEvents.pathCompanyId, pathCompanyIds),
        isNull(pathCompanyEvents.deletedAt)
      )
    )
    .orderBy(asc(pathCompanyEvents.effectiveDate))

  const firstEventDate = rows[0]?.effectiveDate ? toUtcDateOnly(rows[0].effectiveDate) : null

  await recomputeMonthlyIncomeLedgerFromDate(
    ownerUserId,
    firstEventDate ?? toUtcDateOnly(fallbackDate)
  )
}
