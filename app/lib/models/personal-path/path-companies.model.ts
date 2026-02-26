import type {
  CompensationTypeValue,
  CurrencyCodeValue,
} from "@/app/lib/models/common/domain-enums"
import type { WorkSchedule } from "@/app/lib/models/work-schedule/work-schedule.model"

export interface PathCompaniesEntity {
  id: string
  ownerUserId: string
  companyCatalogId: string | null
  roleCatalogId: string | null
  color: string
  displayName: string
  roleDisplayName: string
  compensationType: CompensationTypeValue
  currency: CurrencyCodeValue
  score: number
  review: string
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  workSchedule: WorkSchedule | null
}

export interface PathCompaniesCreateInput {
  companyCatalogId?: string | null
  roleCatalogId?: string | null
  companyName?: string
  roleName?: string
  displayName?: string
  roleDisplayName?: string
  color?: string
  compensationType?: CompensationTypeValue
  currency?: string
  score?: number
  review?: string
  startDate: string
  endDate?: string | null
  workSchedule?: WorkSchedule | null
}

export interface PathCompaniesUpdateInput {
  companyCatalogId?: string | null
  roleCatalogId?: string | null
  companyName?: string
  roleName?: string
  displayName?: string
  roleDisplayName?: string
  color?: string
  compensationType?: CompensationTypeValue
  currency?: string
  score?: number
  review?: string
  startDate?: string
  endDate?: string | null
  workSchedule?: WorkSchedule | null
}

export interface PathCompaniesListResponse {
  items: PathCompaniesEntity[]
  total: number
}

export interface PathCompaniesDeleteResponse {
  id: string
  deletedAt: string
}
