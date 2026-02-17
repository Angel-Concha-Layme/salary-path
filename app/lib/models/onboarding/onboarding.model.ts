import type {
  CompensationTypeValue,
} from "@/app/lib/models/common/domain-enums"
import type { PathCompaniesEntity } from "@/app/lib/models/personal-path/path-companies.model"
import type { PathCompanyEventsEntity } from "@/app/lib/models/personal-path/path-company-events.model"
import type { UserFinanceSettingsEntity } from "@/app/lib/models/settings/user-finance-settings.model"

export interface OnboardingStatusResponse {
  completed: boolean
  completedAt: string | null
}

export interface OnboardingCompleteInput {
  companyName: string
  roleName: string
  startDate: string
  endDate?: string | null
  compensationType: CompensationTypeValue
  currency: string
  initialRate: number
  currentRate: number
  monthlyWorkHours?: number
  workDaysPerYear?: number
  locale?: string
}

export interface OnboardingCompleteResponse {
  completedAt: string
  pathCompany: PathCompaniesEntity
  createdEvents: PathCompanyEventsEntity[]
  settings: UserFinanceSettingsEntity
}
