import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_MONTHLY_WORK_HOURS = 174
export const PERSONAL_PATH_NO_COMPANIES_SELECTION = "__none__"

export type PersonalPathChartView = "rate" | "cumulativeIncome"

export type PersonalPathRangePreset = "all" | "ytd" | "last12m" | "last36m"

export type PersonalPathRateBasis = "monthly" | "hourly"

export interface PersonalPathChartFilters {
  view: PersonalPathChartView
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

export interface PersonalPathCumulativePointMeta {
  type: "cumulative"
  currency: string
  monthlyTotal: number
  activeCompanyIds: string[]
  activeCompanyNames: string[]
}

export type PersonalPathChartPointMeta = PersonalPathRatePointMeta | PersonalPathCumulativePointMeta

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

export interface CurrencyMismatchInfo {
  baseCurrency: string
  excludedCompanyIds: string[]
  excludedCompanyNames: string[]
  excludedCount: number
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

export interface BuildCumulativeIncomeSeriesOptions {
  companies: PathCompaniesEntity[]
  events: PathCompanyEventsEntity[]
  companyIds: string[]
  baseCurrency?: string
  monthlyWorkHours?: number
  range: PersonalPathRangePreset
  referenceDate?: Date
}

export interface BuildCumulativeIncomeSeriesResult {
  series: PersonalPathChartSeries[]
  currencyMismatch: CurrencyMismatchInfo | null
}

interface CompanyRateSegment {
  companyId: string
  companyName: string
  start: Date
  end: Date
  monthlyRate: number
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

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
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

function maxDate(left: Date, right: Date): Date {
  return left.getTime() >= right.getTime() ? left : right
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

export function resolveBaseCurrency(
  companies: PathCompaniesEntity[],
  baseCurrency?: string
): string {
  if (baseCurrency && baseCurrency.trim().length > 0) {
    return baseCurrency.trim().toUpperCase()
  }

  const firstCompanyCurrency = companies[0]?.currency

  if (firstCompanyCurrency && firstCompanyCurrency.trim().length > 0) {
    return firstCompanyCurrency.trim().toUpperCase()
  }

  return "USD"
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

function getDateRangeEndExclusive(referenceDate: Date): Date {
  return addUtcDays(toUtcDateOnly(referenceDate), 1)
}

function isDateInSegment(segment: CompanyRateSegment, date: Date): boolean {
  const timestamp = date.getTime()
  return segment.start.getTime() <= timestamp && timestamp < segment.end.getTime()
}

function buildCumulativeSegmentsForCompany(
  company: PathCompaniesEntity,
  events: PathCompanyEventsEntity[],
  monthlyWorkHours: number,
  referenceDate: Date
): CompanyRateSegment[] {
  const normalizedEvents = normalizeEventRecords(events)

  if (normalizedEvents.length === 0) {
    return []
  }

  const companyStart = parseIsoToUtcDateOnly(company.startDate) ?? normalizedEvents[0].date
  const referenceEndExclusive = getDateRangeEndExclusive(referenceDate)
  const rawCompanyEndDate = company.endDate
    ? parseIsoToUtcDateOnly(company.endDate)
    : toUtcDateOnly(referenceDate)
  const companyEndExclusive = addUtcDays(
    minDate(rawCompanyEndDate ?? toUtcDateOnly(referenceDate), toUtcDateOnly(referenceDate)),
    1
  )
  const safeEndExclusive = minDate(companyEndExclusive, referenceEndExclusive)

  if (safeEndExclusive.getTime() <= companyStart.getTime()) {
    return []
  }

  const segments: CompanyRateSegment[] = []

  normalizedEvents.forEach((record, index) => {
    const next = normalizedEvents[index + 1]
    const nextStart = next?.date ?? safeEndExclusive
    const start = maxDate(record.date, companyStart)
    const end = minDate(nextStart, safeEndExclusive)

    if (end.getTime() <= start.getTime()) {
      return
    }

    segments.push({
      companyId: company.id,
      companyName: company.displayName,
      start,
      end,
      monthlyRate: normalizeAmountToMonthly(
        record.source.amount,
        company.compensationType,
        monthlyWorkHours
      ),
    })
  })

  return segments
}

function buildCurrencyMismatchInfo(
  baseCurrency: string,
  selectedCompanies: PathCompaniesEntity[],
  includedCompanyIds: Set<string>
): CurrencyMismatchInfo | null {
  const excludedCompanies = selectedCompanies.filter(
    (company) => !includedCompanyIds.has(company.id)
  )

  if (excludedCompanies.length === 0) {
    return null
  }

  return {
    baseCurrency,
    excludedCompanyIds: excludedCompanies.map((company) => company.id),
    excludedCompanyNames: excludedCompanies.map((company) => company.displayName),
    excludedCount: excludedCompanies.length,
  }
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

export function buildCumulativeIncomeSeries(
  options: BuildCumulativeIncomeSeriesOptions
): BuildCumulativeIncomeSeriesResult {
  const referenceDate = options.referenceDate ?? new Date()
  const monthlyWorkHours = options.monthlyWorkHours ?? DEFAULT_MONTHLY_WORK_HOURS
  const selectedCompanies = options.companies.filter((company) =>
    options.companyIds.includes(company.id)
  )
  const baseCurrency = resolveBaseCurrency(selectedCompanies, options.baseCurrency)
  const includedCompanies = selectedCompanies.filter(
    (company) => company.currency.toUpperCase() === baseCurrency
  )
  const includedCompanyIds = new Set(includedCompanies.map((company) => company.id))

  const currencyMismatch = buildCurrencyMismatchInfo(
    baseCurrency,
    selectedCompanies,
    includedCompanyIds
  )

  if (includedCompanies.length === 0) {
    return {
      series: [],
      currencyMismatch,
    }
  }

  const eventsByCompany = buildCompanyEventsMap(options.events)
  const segments = includedCompanies.flatMap((company) =>
    buildCumulativeSegmentsForCompany(
      company,
      eventsByCompany.get(company.id) ?? [],
      monthlyWorkHours,
      referenceDate
    )
  )

  if (segments.length === 0) {
    return {
      series: [],
      currencyMismatch,
    }
  }

  const boundaries = Array.from(
    new Set(
      segments.flatMap((segment) => [
        segment.start.getTime(),
        segment.end.getTime(),
      ])
    )
  )
    .sort((left, right) => left - right)
    .map((value) => new Date(value))

  const firstBoundary = boundaries[0]

  if (!firstBoundary) {
    return {
      series: [],
      currencyMismatch,
    }
  }

  let cumulativeValue = 0

  const initialActiveSegments = segments.filter((segment) =>
    isDateInSegment(segment, firstBoundary)
  )
  const initialActiveCompanyIds = Array.from(
    new Set(initialActiveSegments.map((segment) => segment.companyId))
  )
  const initialActiveCompanyNames = Array.from(
    new Set(initialActiveSegments.map((segment) => segment.companyName))
  )
  const initialMonthlyTotal = initialActiveSegments.reduce(
    (total, segment) => total + segment.monthlyRate,
    0
  )

  const points: PersonalPathChartSeriesPoint[] = [
    {
      time: toDateKey(firstBoundary),
      value: cumulativeValue,
      meta: {
        type: "cumulative",
        currency: baseCurrency,
        monthlyTotal: initialMonthlyTotal,
        activeCompanyIds: initialActiveCompanyIds,
        activeCompanyNames: initialActiveCompanyNames,
      },
    },
  ]

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const segmentStart = boundaries[index]
    const segmentEnd = boundaries[index + 1]

    if (!segmentStart || !segmentEnd) {
      continue
    }

    const activeSegments = segments.filter((segment) =>
      isDateInSegment(segment, segmentStart)
    )
    const monthlyTotal = activeSegments.reduce(
      (total, segment) => total + segment.monthlyRate,
      0
    )
    const days = (segmentEnd.getTime() - segmentStart.getTime()) / DAY_MS
    const segmentIncome = monthlyTotal * (12 / 365) * days

    cumulativeValue += segmentIncome

    points.push({
      time: toDateKey(segmentEnd),
      value: cumulativeValue,
      meta: {
        type: "cumulative",
        currency: baseCurrency,
        monthlyTotal,
        activeCompanyIds: Array.from(
          new Set(activeSegments.map((segment) => segment.companyId))
        ),
        activeCompanyNames: Array.from(
          new Set(activeSegments.map((segment) => segment.companyName))
        ),
      },
    })
  }

  return {
    series: [
      {
        id: "cumulative-income",
        label: "Cumulative income",
        color: "#0F766E",
        lineType: "simple",
        points: filterPointsByRange(points, options.range, referenceDate),
      },
    ],
    currencyMismatch,
  }
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
