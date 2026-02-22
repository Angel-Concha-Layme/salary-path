import { and, desc, eq, isNull } from "drizzle-orm"

import { db } from "@/app/lib/db/client"
import {
  normalizeCompensationType,
  normalizeCurrencyCode,
  normalizePathCompanyEventType,
  type CompensationTypeValue,
  type CurrencyCodeValue,
} from "@/app/lib/models/common/domain-enums"
import {
  pathCompanies,
  pathCompanyEvents,
  user,
  userFinanceSettings,
} from "@/app/lib/db/schema"
import type {
  ProfileCareerEvent,
  ProfileCareerEventsByCompany,
  ProfileOverviewFinanceSettings,
  ProfileOverviewResponse,
  ProfileSalaryByCompany,
} from "@/app/lib/models/profile/profile-overview.model"
import { normalizeAmountToMonthly } from "@/app/lib/models/personal-path/personal-path-chart.model"
import { ApiError } from "@/app/lib/server/api-error"
import { toIso } from "@/app/lib/server/domain/common"

const DEFAULT_MONTHLY_WORK_HOURS = 174
const DEFAULT_WORK_DAYS_PER_YEAR = 261
const DEFAULT_LOCALE = "es"
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25

interface CompanyAccumulator {
  pathCompanyId: string
  displayName: string
  roleDisplayName: string
  color: string
  currency: CurrencyCodeValue
  compensationType: CompensationTypeValue
  startDate: string
  endDate: string | null
  score: number
  events: ProfileCareerEvent[]
}

function normalizeLocale(value: string | null | undefined): string {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : DEFAULT_LOCALE
}

function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals))
}

function getUtcTimestamp(value: string | null): number | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.getTime()
}

function buildUsefulInfo(
  companies: CompanyAccumulator[],
  monthlyWorkHours: number,
  workDaysPerYear: number,
  preferredCurrency: CurrencyCodeValue,
  preferredLocale: string
) {
  const totalCompanies = companies.length
  const totalCareerEvents = companies.reduce((sum, company) => sum + company.events.length, 0)
  const averageCompanyScore = totalCompanies > 0
    ? round(companies.reduce((sum, company) => sum + company.score, 0) / totalCompanies, 1)
    : null

  const nowTimestamp = Date.now()

  const activeCompanies = companies.reduce((sum, company) => {
    const companyEndTime = getUtcTimestamp(company.endDate)

    if (companyEndTime === null || companyEndTime >= nowTimestamp) {
      return sum + 1
    }

    return sum
  }, 0)

  const firstCompanyStartTimestamp = companies.reduce<number | null>((minTimestamp, company) => {
    const companyStartTime = getUtcTimestamp(company.startDate)

    if (companyStartTime === null) {
      return minTimestamp
    }

    if (minTimestamp === null || companyStartTime < minTimestamp) {
      return companyStartTime
    }

    return minTimestamp
  }, null)

  const latestCareerEventTimestamp = companies.reduce<number | null>((maxTimestamp, company) => {
    const latestEvent = company.events[0]
    const eventTime = latestEvent ? getUtcTimestamp(latestEvent.effectiveDate) : null

    if (eventTime === null) {
      return maxTimestamp
    }

    if (maxTimestamp === null || eventTime > maxTimestamp) {
      return eventTime
    }

    return maxTimestamp
  }, null)

  const latestCompanyEndTimestamp = companies.reduce<number | null>((maxTimestamp, company) => {
    const endTime = getUtcTimestamp(company.endDate)

    if (endTime === null) {
      return maxTimestamp
    }

    if (maxTimestamp === null || endTime > maxTimestamp) {
      return endTime
    }

    return maxTimestamp
  }, null)

  let yearsTracked: number | null = null
  if (firstCompanyStartTimestamp !== null) {
    const endReferenceTimestamp = activeCompanies > 0
      ? nowTimestamp
      : latestCareerEventTimestamp ?? latestCompanyEndTimestamp ?? nowTimestamp
    const elapsed = Math.max(0, endReferenceTimestamp - firstCompanyStartTimestamp)
    yearsTracked = round(elapsed / MS_PER_YEAR, 2)
  }

  return {
    totalCompanies,
    activeCompanies,
    totalCareerEvents,
    averageCompanyScore,
    firstCompanyStartDate:
      firstCompanyStartTimestamp !== null ? new Date(firstCompanyStartTimestamp).toISOString() : null,
    latestCareerEventDate:
      latestCareerEventTimestamp !== null ? new Date(latestCareerEventTimestamp).toISOString() : null,
    yearsTracked,
    monthlyWorkHours,
    workDaysPerYear,
    preferredCurrency,
    preferredLocale,
  }
}

export async function getProfileOverview(
  ownerUserId: string,
  source: "jwt" | "cookie"
): Promise<ProfileOverviewResponse> {
  const rows = await db
    .select({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      userImage: user.image,
      userCreatedAt: user.createdAt,
      userUpdatedAt: user.updatedAt,
      userOnboardingCompletedAt: user.onboardingCompletedAt,
      userBanned: user.banned,
      userBanReason: user.banReason,
      userBanExpires: user.banExpires,
      settingsId: userFinanceSettings.id,
      settingsCurrency: userFinanceSettings.currency,
      settingsLocale: userFinanceSettings.locale,
      settingsMonthlyWorkHours: userFinanceSettings.monthlyWorkHours,
      settingsWorkDaysPerYear: userFinanceSettings.workDaysPerYear,
      settingsUpdatedAt: userFinanceSettings.updatedAt,
      pathCompanyId: pathCompanies.id,
      pathCompanyDisplayName: pathCompanies.displayName,
      pathCompanyRoleDisplayName: pathCompanies.roleDisplayName,
      pathCompanyColor: pathCompanies.color,
      pathCompanyCurrency: pathCompanies.currency,
      pathCompanyCompensationType: pathCompanies.compensationType,
      pathCompanyScore: pathCompanies.score,
      pathCompanyStartDate: pathCompanies.startDate,
      pathCompanyEndDate: pathCompanies.endDate,
      eventId: pathCompanyEvents.id,
      eventType: pathCompanyEvents.eventType,
      eventEffectiveDate: pathCompanyEvents.effectiveDate,
      eventAmount: pathCompanyEvents.amount,
      eventNotes: pathCompanyEvents.notes,
      eventUpdatedAt: pathCompanyEvents.updatedAt,
    })
    .from(user)
    .leftJoin(
      userFinanceSettings,
      and(
        eq(userFinanceSettings.ownerUserId, user.id),
        isNull(userFinanceSettings.deletedAt)
      )
    )
    .leftJoin(
      pathCompanies,
      and(eq(pathCompanies.ownerUserId, user.id), isNull(pathCompanies.deletedAt))
    )
    .leftJoin(
      pathCompanyEvents,
      and(
        eq(pathCompanyEvents.pathCompanyId, pathCompanies.id),
        isNull(pathCompanyEvents.deletedAt)
      )
    )
    .where(eq(user.id, ownerUserId))
    .orderBy(
      desc(pathCompanies.startDate),
      desc(pathCompanyEvents.effectiveDate),
      desc(pathCompanyEvents.updatedAt)
    )

  const firstRow = rows[0]

  if (!firstRow) {
    throw new ApiError(404, "NOT_FOUND", "User not found")
  }

  const financeSettings: ProfileOverviewFinanceSettings | null = firstRow.settingsId
    ? {
      currency: normalizeCurrencyCode(firstRow.settingsCurrency),
      locale: normalizeLocale(firstRow.settingsLocale),
      monthlyWorkHours: firstRow.settingsMonthlyWorkHours ?? DEFAULT_MONTHLY_WORK_HOURS,
      workDaysPerYear: firstRow.settingsWorkDaysPerYear ?? DEFAULT_WORK_DAYS_PER_YEAR,
      updatedAt: toIso(firstRow.settingsUpdatedAt) ?? new Date(0).toISOString(),
    }
    : null

  const companyMap = new Map<string, CompanyAccumulator>()

  rows.forEach((row) => {
    if (!row.pathCompanyId) {
      return
    }

    const existing = companyMap.get(row.pathCompanyId)

    if (!existing) {
      companyMap.set(row.pathCompanyId, {
        pathCompanyId: row.pathCompanyId,
        displayName: row.pathCompanyDisplayName ?? "",
        roleDisplayName: row.pathCompanyRoleDisplayName ?? "",
        color: row.pathCompanyColor ?? "#0F766E",
        currency: normalizeCurrencyCode(row.pathCompanyCurrency),
        compensationType: normalizeCompensationType(row.pathCompanyCompensationType),
        score: row.pathCompanyScore ?? 0,
        startDate: toIso(row.pathCompanyStartDate) ?? new Date(0).toISOString(),
        endDate: toIso(row.pathCompanyEndDate),
        events: [],
      })
    }

    if (!row.eventId || !row.eventType || !row.eventEffectiveDate || row.eventAmount === null) {
      return
    }

    const target = companyMap.get(row.pathCompanyId)

    if (!target) {
      return
    }

    target.events.push({
      id: row.eventId,
      eventType: normalizePathCompanyEventType(row.eventType),
      effectiveDate: toIso(row.eventEffectiveDate) ?? new Date(0).toISOString(),
      amount: row.eventAmount,
      notes: row.eventNotes,
    })
  })

  const companies = Array.from(companyMap.values())
    .map((company) => ({
      ...company,
      events: [...company.events].sort((left, right) => {
        const byDate =
          new Date(right.effectiveDate).getTime() - new Date(left.effectiveDate).getTime()

        if (byDate !== 0) {
          return byDate
        }

        return right.id.localeCompare(left.id)
      }),
    }))
    .sort(
      (left, right) =>
        new Date(right.startDate).getTime() - new Date(left.startDate).getTime()
    )

  const monthlyWorkHours =
    financeSettings?.monthlyWorkHours ?? DEFAULT_MONTHLY_WORK_HOURS
  const preferredCurrency = financeSettings?.currency ?? normalizeCurrencyCode(companies[0]?.currency)
  const preferredLocale = financeSettings?.locale ?? DEFAULT_LOCALE

  const salaryByCompany: ProfileSalaryByCompany[] = companies.map((company) => {
    const latestEvent = company.events[0] ?? null
    const monthlyEquivalent = latestEvent
      ? normalizeAmountToMonthly(
        latestEvent.amount,
        company.compensationType,
        monthlyWorkHours
      )
      : null
    const annualizedSalary = monthlyEquivalent !== null ? monthlyEquivalent * 12 : null

    return {
      pathCompanyId: company.pathCompanyId,
      displayName: company.displayName,
      roleDisplayName: company.roleDisplayName,
      color: company.color,
      currency: company.currency,
      compensationType: company.compensationType,
      currentRate: latestEvent?.amount ?? null,
      currentRateDate: latestEvent?.effectiveDate ?? null,
      currentRateEventType: latestEvent?.eventType ?? null,
      monthlyEquivalent: monthlyEquivalent !== null ? round(monthlyEquivalent, 2) : null,
      annualizedSalary: annualizedSalary !== null ? round(annualizedSalary, 2) : null,
      eventCount: company.events.length,
    }
  })

  const annualAverageCandidates = salaryByCompany.filter(
    (salary) =>
      salary.annualizedSalary !== null &&
      normalizeCurrencyCode(salary.currency) === preferredCurrency
  )
  const annualAverage =
    annualAverageCandidates.length > 0
      ? round(
        annualAverageCandidates.reduce(
          (sum, salary) => sum + (salary.annualizedSalary ?? 0),
          0
        ) / annualAverageCandidates.length,
        2
      )
      : null

  const excludedFromAverageCount = salaryByCompany.filter(
    (salary) =>
      salary.annualizedSalary !== null &&
      normalizeCurrencyCode(salary.currency) !== preferredCurrency
  ).length

  const careerEventsByCompany: ProfileCareerEventsByCompany[] = companies.map((company) => ({
    pathCompanyId: company.pathCompanyId,
    displayName: company.displayName,
    roleDisplayName: company.roleDisplayName,
    color: company.color,
    currency: company.currency,
    compensationType: company.compensationType,
    events: company.events,
  }))

  return {
    source,
    user: {
      id: firstRow.userId,
      email: firstRow.userEmail,
      name: firstRow.userName,
      role: firstRow.userRole,
      image: firstRow.userImage,
      createdAt: toIso(firstRow.userCreatedAt) ?? new Date(0).toISOString(),
      updatedAt: toIso(firstRow.userUpdatedAt) ?? new Date(0).toISOString(),
      onboardingCompletedAt: toIso(firstRow.userOnboardingCompletedAt),
      banned: Boolean(firstRow.userBanned),
      banReason: firstRow.userBanReason,
      banExpires: toIso(firstRow.userBanExpires),
    },
    financeSettings,
    salary: {
      baseCurrency: preferredCurrency,
      annualAverage,
      annualAverageCompanyCount: annualAverageCandidates.length,
      excludedFromAverageCount,
      totalCompanies: salaryByCompany.length,
      byCompany: salaryByCompany,
    },
    careerEventsByCompany,
    usefulInfo: buildUsefulInfo(
      companies,
      monthlyWorkHours,
      financeSettings?.workDaysPerYear ?? DEFAULT_WORK_DAYS_PER_YEAR,
      preferredCurrency,
      preferredLocale
    ),
  }
}
