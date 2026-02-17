import type { CurrencyCodeValue } from "@/app/lib/models/common/domain-enums"

export interface UserFinanceSettingsEntity {
  id: string
  ownerUserId: string
  currency: CurrencyCodeValue
  locale: string
  monthlyWorkHours: number
  workDaysPerYear: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface UserFinanceSettingsCreateInput {
  currency: string
  locale: string
  monthlyWorkHours?: number
  workDaysPerYear?: number
}

export interface UserFinanceSettingsUpdateInput {
  currency?: string
  locale?: string
  monthlyWorkHours?: number
  workDaysPerYear?: number
}

export interface UserFinanceSettingsListParams {
  limit?: number
}

export interface UserFinanceSettingsListResponse {
  items: UserFinanceSettingsEntity[]
  total: number
}

export interface UserFinanceSettingsDeleteResponse {
  id: string
  deletedAt: string
}
