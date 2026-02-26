import type {
  CompensationTypeValue,
} from "@/app/lib/models/common/domain-enums"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { UserFinanceSettingsEntity } from "@/app/lib/models/settings/user-finance-settings.model"
import type { WorkSchedule } from "@/app/lib/models/work-schedule/work-schedule.model"

export interface OnboardingStatusResponse {
  completed: boolean
  completedAt: string | null
}

export type OnboardingEventType =
  | "rate_increase"
  | "annual_increase"
  | "mid_year_increase"
  | "promotion"

export interface OnboardingCompanyEventInput {
  eventType: OnboardingEventType
  effectiveDate: string
  amount: number
  notes?: string | null
}

export interface OnboardingCompanyInput {
  companyName: string
  roleName: string
  startDate: string
  endDate?: string | null
  compensationType: CompensationTypeValue
  currency: string
  startRate: number
  events: OnboardingCompanyEventInput[]
  workSchedule?: WorkSchedule
}

export interface OnboardingCompleteInput {
  defaultWorkSchedule: WorkSchedule
  companies: [OnboardingCompanyInput, ...OnboardingCompanyInput[]]
  locale?: string
}

export interface OnboardingCompleteResponse {
  completedAt: string
  createdCompanies: PathCompaniesEntity[]
  createdEvents: PathCompanyEventsEntity[]
  settings: UserFinanceSettingsEntity
}
