import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"

const DEFAULT_MONTHLY_WORK_HOURS = 174
export const PERSONAL_PATH_NO_COMPANIES_SELECTION = "__none__"

export type PersonalPathChartView = "rate"

export type PersonalPathRangePreset = "all" | "ytd" | "last12m" | "last36m"

export type PersonalPathRateBasis = "monthly" | "hourly"

export interface PersonalPathChartFilters {
  range: PersonalPathRangePreset
  rateBasis: PersonalPathRateBasis
  companyIds: string[]
}

export interface PersonalPathRatePointMeta {
  type: "rate"
  companyId: string
  companyName: string
  companyColor: string
  currency: string
  compensationType: PathCompaniesEntity["compensationType"]
  normalizedCompensationType: PersonalPathRateBasis
  eventType: PathCompanyEventsEntity["eventType"]
  amount: number
  increase: number
}

export type PersonalPathChartPointMeta = PersonalPathRatePointMeta

export interface PersonalPathChartSeriesPoint {
  time: string
  value: number
  meta: PersonalPathChartPointMeta
}

export interface PersonalPathChartSeries {
  id: string
  label: string
  color: string
  lineType: "steps" | "simple"
  pointMarkersVisible?: boolean
  showInLegend?: boolean
  showInTooltip?: boolean
  points: PersonalPathChartSeriesPoint[]
}

export interface PersonalPathCompanyTableRow {
  id: string
  displayName: string
  roleDisplayName: string
  startDate: string
  endDate: string | null
  monthlyAverageSalary: number | null
  annualSalary: number | null
  compensationType: PathCompaniesEntity["compensationType"]
  currency: string
  score: number
  review: string
  color: string
  companyCatalogId: string | null
  roleCatalogId: string | null
  createdAt: string
  updatedAt: string
  eventCount: number
  latestEventType: PathCompanyEventsEntity["eventType"] | null
  latestEventDate: string | null
  latestEventAmount: number | null
}

export interface BuildRateChartSeriesOptions {
  companies: PathCompaniesEntity[]
  events: PathCompanyEventsEntity[]
  companyIds: string[]
  range: PersonalPathRangePreset
  rateBasis: PersonalPathRateBasis
  monthlyWorkHours?: number
  referenceDate?: Date
}

interface HistoricalRateAnchor {
  companyId: string
  date: Date
  amount: number
  compensationType: PathCompaniesEntity["compensationType"]
}

interface NormalizedEventRecord {
  date: Date
  source: PathCompanyEventsEntity
}

function toUtcDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function parseIsoToUtcDateOnly(value: string): Date | null {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return toUtcDateOnly(parsed)
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function subtractUtcMonths(date: Date, months: number): Date {
  const firstOfTargetMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1)
  )
  const monthLength = new Date(
    Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth() + 1, 0)
  ).getUTCDate()
  const day = Math.min(date.getUTCDate(), monthLength)

  return new Date(
    Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth(), day)
  )
}

function minDate(left: Date, right: Date): Date {
  return left.getTime() <= right.getTime() ? left : right
}

function compareByIsoDateAsc(left: { effectiveDate: string }, right: { effectiveDate: string }): number {
  return new Date(left.effectiveDate).getTime() - new Date(right.effectiveDate).getTime()
}

function compareByIsoDateDesc(left: { effectiveDate: string }, right: { effectiveDate: string }): number {
  return new Date(right.effectiveDate).getTime() - new Date(left.effectiveDate).getTime()
}

function sortEventsAsc(events: PathCompanyEventsEntity[]): PathCompanyEventsEntity[] {
  return [...events].sort(compareByIsoDateAsc)
}

function sortEventsDesc(events: PathCompanyEventsEntity[]): PathCompanyEventsEntity[] {
  return [...events].sort(compareByIsoDateDesc)
}

function resolveRangeStart(
  range: PersonalPathRangePreset,
  referenceDate: Date
): Date | null {
  const normalizedReference = toUtcDateOnly(referenceDate)

  if (range === "all") {
    return null
  }

  if (range === "ytd") {
    return new Date(Date.UTC(normalizedReference.getUTCFullYear(), 0, 1))
  }

  if (range === "last12m") {
    return subtractUtcMonths(normalizedReference, 12)
  }

  return subtractUtcMonths(normalizedReference, 36)
}

function filterPointsByRange(
  points: PersonalPathChartSeriesPoint[],
  range: PersonalPathRangePreset,
  referenceDate: Date
): PersonalPathChartSeriesPoint[] {
  if (range === "all" || points.length === 0) {
    return points
  }

  const rangeStart = resolveRangeStart(range, referenceDate)

  if (!rangeStart) {
    return points
  }

  const rangeStartKey = toDateKey(rangeStart)
  const firstVisibleIndex = points.findIndex((point) => point.time >= rangeStartKey)

  if (firstVisibleIndex === 0) {
    return points
  }

  if (firstVisibleIndex === -1) {
    const tailPoint = points[points.length - 1]

    if (!tailPoint) {
      return []
    }

    return [
      {
        ...tailPoint,
        time: rangeStartKey,
      },
    ]
  }

  const firstVisiblePoint = points[firstVisibleIndex]
  const previousPoint = points[firstVisibleIndex - 1]

  if (!firstVisiblePoint || !previousPoint) {
    return points.slice(firstVisibleIndex)
  }

  if (firstVisiblePoint.time === rangeStartKey) {
    return points.slice(firstVisibleIndex)
  }

  return [
    {
      ...previousPoint,
      time: rangeStartKey,
    },
    ...points.slice(firstVisibleIndex),
  ]
}

function normalizeEventRecords(events: PathCompanyEventsEntity[]): NormalizedEventRecord[] {
  return sortEventsAsc(events)
    .map((event) => {
      const date = parseIsoToUtcDateOnly(event.effectiveDate)

      if (!date) {
        return null
      }

      return {
        date,
        source: event,
      }
    })
    .filter((record): record is NormalizedEventRecord => Boolean(record))
}

function buildCompanyEventsMap(
  events: PathCompanyEventsEntity[]
): Map<string, PathCompanyEventsEntity[]> {
  const map = new Map<string, PathCompanyEventsEntity[]>()

  events.forEach((event) => {
    const current = map.get(event.pathCompanyId) ?? []
    current.push(event)
    map.set(event.pathCompanyId, current)
  })

  return map
}

function resolveRateSeriesEndDate(
  company: PathCompaniesEntity,
  normalizedEvents: NormalizedEventRecord[],
  referenceDate: Date
): Date {
  const normalizedReferenceDate = toUtcDateOnly(referenceDate)
  const explicitCompanyEndDate = company.endDate
    ? parseIsoToUtcDateOnly(company.endDate)
    : null
  const latestEndOfEmploymentEventDate = normalizedEvents
    .filter((record) => record.source.eventType === "end_of_employment")
    .at(-1)?.date ?? null
  const explicitEndDate = latestEndOfEmploymentEventDate ?? explicitCompanyEndDate

  if (!explicitEndDate) {
    return normalizedReferenceDate
  }

  return minDate(explicitEndDate, normalizedReferenceDate)
}

function buildHistoricalRateAnchors(
  companies: PathCompaniesEntity[],
  rateEventsByCompany: Map<string, NormalizedEventRecord[]>
): HistoricalRateAnchor[] {
  const companiesById = new Map(companies.map((company) => [company.id, company]))
  const anchors: HistoricalRateAnchor[] = []

  rateEventsByCompany.forEach((events, companyId) => {
    const company = companiesById.get(companyId)

    if (!company) {
      return
    }

    events.forEach((event) => {
      anchors.push({
        companyId,
        date: event.date,
        amount: event.source.amount,
        compensationType: company.compensationType,
      })
    })
  })

  return anchors.sort((left, right) => left.date.getTime() - right.date.getTime())
}

function resolvePreviousCareerAnchor(
  anchors: HistoricalRateAnchor[],
  companyId: string,
  date: Date
): HistoricalRateAnchor | null {
  const targetTimestamp = date.getTime()

  for (let index = anchors.length - 1; index >= 0; index -= 1) {
    const anchor = anchors[index]

    if (!anchor) {
      continue
    }

    if (anchor.companyId === companyId) {
      continue
    }

    if (anchor.date.getTime() <= targetTimestamp) {
      return anchor
    }
  }

  return null
}

export function normalizeAmountToMonthly(
  amount: number,
  compensationType: PathCompaniesEntity["compensationType"],
  monthlyWorkHours?: number
): number {
  if (compensationType === "monthly") {
    return amount
  }

  const hours = monthlyWorkHours && monthlyWorkHours > 0
    ? monthlyWorkHours
    : DEFAULT_MONTHLY_WORK_HOURS

  return amount * hours
}

function resolveMonthlyWorkHours(monthlyWorkHours?: number): number {
  if (monthlyWorkHours && monthlyWorkHours > 0) {
    return monthlyWorkHours
  }

  return DEFAULT_MONTHLY_WORK_HOURS
}

export function normalizeAmountToHourly(
  amount: number,
  compensationType: PathCompaniesEntity["compensationType"],
  monthlyWorkHours?: number
): number {
  if (compensationType === "hourly") {
    return amount
  }

  return amount / resolveMonthlyWorkHours(monthlyWorkHours)
}

export function normalizeAmountToRateBasis(
  amount: number,
  compensationType: PathCompaniesEntity["compensationType"],
  basis: PersonalPathRateBasis,
  monthlyWorkHours?: number
): number {
  if (basis === "monthly") {
    return normalizeAmountToMonthly(amount, compensationType, monthlyWorkHours)
  }

  return normalizeAmountToHourly(amount, compensationType, monthlyWorkHours)
}

export function buildRateChartSeries(
  options: BuildRateChartSeriesOptions
): PersonalPathChartSeries[] {
  const referenceDate = options.referenceDate ?? new Date()
  const companiesById = new Map(options.companies.map((company) => [company.id, company]))
  const eventsByCompany = buildCompanyEventsMap(options.events)
  const monthlyWorkHours = resolveMonthlyWorkHours(options.monthlyWorkHours)
  const normalizedEventsByCompany = new Map<string, NormalizedEventRecord[]>()
  const activeRateEventsByCompany = new Map<string, NormalizedEventRecord[]>()
  const seriesEndDateByCompany = new Map<string, Date>()
  const result: PersonalPathChartSeries[] = []

  options.companies.forEach((company) => {
    const sortedEvents = sortEventsAsc(eventsByCompany.get(company.id) ?? [])

    if (sortedEvents.length === 0) {
      return
    }

    const normalizedEvents = normalizeEventRecords(sortedEvents)

    if (normalizedEvents.length === 0) {
      return
    }

    const seriesEndDate = resolveRateSeriesEndDate(company, normalizedEvents, referenceDate)
    const activeEvents = normalizedEvents.filter(
      (record) =>
        record.source.eventType !== "end_of_employment" &&
        record.date.getTime() <= seriesEndDate.getTime()
    )

    normalizedEventsByCompany.set(company.id, normalizedEvents)
    activeRateEventsByCompany.set(company.id, activeEvents)
    seriesEndDateByCompany.set(company.id, seriesEndDate)
  })

  const historicalRateAnchors = buildHistoricalRateAnchors(
    options.companies,
    activeRateEventsByCompany
  )

  options.companyIds.forEach((companyId) => {
    const company = companiesById.get(companyId)

    if (!company) {
      return
    }

    const normalizedEvents = normalizedEventsByCompany.get(companyId) ?? []
    const seriesEndDate = seriesEndDateByCompany.get(companyId)
    const activeEvents = activeRateEventsByCompany.get(companyId) ?? []

    if (normalizedEvents.length === 0 || !seriesEndDate) {
      return
    }

    const endOfEmploymentRecord = normalizedEvents
      .filter(
        (record) =>
          record.source.eventType === "end_of_employment" &&
          record.date.getTime() <= seriesEndDate.getTime()
      )
      .at(-1) ?? null

    if (activeEvents.length === 0) {
      return
    }

    const points = activeEvents.map((record, index): PersonalPathChartSeriesPoint => {
      const event = record.source
      const previousEvent = activeEvents[index - 1]
      const previousCareerAnchor = previousEvent
        ? null
        : resolvePreviousCareerAnchor(historicalRateAnchors, company.id, record.date)
      const previousAmount =
        previousEvent?.source.amount ??
        previousCareerAnchor?.amount ??
        event.amount
      const previousCompensationType =
        previousEvent
          ? company.compensationType
          : previousCareerAnchor?.compensationType ?? company.compensationType
      const normalizedAmount = normalizeAmountToRateBasis(
        event.amount,
        company.compensationType,
        options.rateBasis,
        monthlyWorkHours
      )
      const normalizedPreviousAmount = normalizeAmountToRateBasis(
        previousAmount,
        previousCompensationType,
        options.rateBasis,
        monthlyWorkHours
      )

      return {
        time: toDateKey(record.date),
        value: normalizedAmount,
        meta: {
          type: "rate",
          companyId: company.id,
          companyName: company.displayName,
          companyColor: company.color,
          currency: company.currency,
          compensationType: company.compensationType,
          normalizedCompensationType: options.rateBasis,
          eventType: event.eventType,
          amount: normalizedAmount,
          increase: normalizedAmount - normalizedPreviousAmount,
        },
      }
    })

    if (endOfEmploymentRecord) {
      const lastPoint = points[points.length - 1]
      const endDateKey = toDateKey(endOfEmploymentRecord.date)

      if (lastPoint?.meta.type === "rate" && lastPoint.time <= endDateKey) {
        const endPoint: PersonalPathChartSeriesPoint = {
          ...lastPoint,
          time: endDateKey,
          meta: {
            ...lastPoint.meta,
            eventType: "end_of_employment",
            increase: 0,
            amount: lastPoint.value,
          },
        }

        if (lastPoint.time === endDateKey) {
          points[points.length - 1] = endPoint
        } else {
          points.push(endPoint)
        }
      }
    }

    const lastPoint = points[points.length - 1]
    const seriesEndDateKey = toDateKey(seriesEndDate)

    result.push({
      id: company.id,
      label: company.displayName,
      color: company.color,
      lineType: "steps",
      points: filterPointsByRange(points, options.range, referenceDate),
    })

    if (lastPoint?.meta.type === "rate" && lastPoint.time < seriesEndDateKey) {
      const continuationPoint: PersonalPathChartSeriesPoint = {
        ...lastPoint,
        time: seriesEndDateKey,
        meta: {
          ...lastPoint.meta,
          increase: 0,
        },
      }

      result.push({
        id: `${company.id}--continuation`,
        label: company.displayName,
        color: company.color,
        lineType: "steps",
        pointMarkersVisible: false,
        showInLegend: false,
        showInTooltip: false,
        points: filterPointsByRange([lastPoint, continuationPoint], options.range, referenceDate),
      })
    }
  })

  return result
}

export function buildPersonalPathCompanyTableRows(
  companies: PathCompaniesEntity[],
  events: PathCompanyEventsEntity[],
  monthlyWorkHours?: number
): PersonalPathCompanyTableRow[] {
  const eventsByCompany = buildCompanyEventsMap(events)

  return [...companies]
    .sort((left, right) => new Date(right.startDate).getTime() - new Date(left.startDate).getTime())
    .map((company) => {
      const companyEvents = sortEventsDesc(eventsByCompany.get(company.id) ?? [])
      const latestEvent = companyEvents[0]
      const monthlyAverageSalary = latestEvent
        ? normalizeAmountToMonthly(
          latestEvent.amount,
          company.compensationType,
          monthlyWorkHours
        )
        : null

      return {
        id: company.id,
        displayName: company.displayName,
        roleDisplayName: company.roleDisplayName,
        startDate: company.startDate,
        endDate: company.endDate,
        monthlyAverageSalary,
        annualSalary: monthlyAverageSalary !== null ? monthlyAverageSalary * 12 : null,
        compensationType: company.compensationType,
        currency: company.currency,
        score: company.score,
        review: company.review,
        color: company.color,
        companyCatalogId: company.companyCatalogId,
        roleCatalogId: company.roleCatalogId,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        eventCount: companyEvents.length,
        latestEventType: latestEvent?.eventType ?? null,
        latestEventDate: latestEvent?.effectiveDate ?? null,
        latestEventAmount: latestEvent?.amount ?? null,
      }
    })
}
