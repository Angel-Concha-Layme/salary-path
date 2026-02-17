import type { CurrencyCodeValue } from "@/app/lib/models/common/domain-enums"
import type { PathCompanyEventType } from "@/app/lib/models/personal-path/path-company-events.model"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"

export interface ProfileOverviewUser {
  id: string
  email: string
  name: string
  role: string
  image: string | null
  createdAt: string
  updatedAt: string
  onboardingCompletedAt: string | null
  banned: boolean
  banReason: string | null
  banExpires: string | null
}

export interface ProfileOverviewFinanceSettings {
  currency: CurrencyCodeValue
  locale: string
  monthlyWorkHours: number
  workDaysPerYear: number
  updatedAt: string
}

export interface ProfileSalaryByCompany {
  pathCompanyId: string
  displayName: string
  roleDisplayName: string
  color: string
  currency: CurrencyCodeValue
  compensationType: PathCompaniesEntity["compensationType"]
  currentRate: number | null
  currentRateDate: string | null
  currentRateEventType: PathCompanyEventType | null
  monthlyEquivalent: number | null
  annualizedSalary: number | null
  eventCount: number
}

export interface ProfileSalarySummary {
  baseCurrency: CurrencyCodeValue
  annualAverage: number | null
  annualAverageCompanyCount: number
  excludedFromAverageCount: number
  totalCompanies: number
  byCompany: ProfileSalaryByCompany[]
}

export interface ProfileCareerEvent {
  id: string
  eventType: PathCompanyEventType
  effectiveDate: string
  amount: number
  notes: string | null
}

export interface ProfileCareerEventsByCompany {
  pathCompanyId: string
  displayName: string
  roleDisplayName: string
  color: string
  currency: CurrencyCodeValue
  compensationType: PathCompaniesEntity["compensationType"]
  events: ProfileCareerEvent[]
}

export interface ProfileUsefulInfo {
  totalCompanies: number
  activeCompanies: number
  totalCareerEvents: number
  averageCompanyScore: number | null
  firstCompanyStartDate: string | null
  latestCareerEventDate: string | null
  yearsTracked: number | null
  monthlyWorkHours: number
  workDaysPerYear: number
  preferredCurrency: CurrencyCodeValue
  preferredLocale: string
}

export interface ProfileOverviewResponse {
  source: "jwt" | "cookie"
  user: ProfileOverviewUser
  financeSettings: ProfileOverviewFinanceSettings | null
  salary: ProfileSalarySummary
  careerEventsByCompany: ProfileCareerEventsByCompany[]
  usefulInfo: ProfileUsefulInfo
}
