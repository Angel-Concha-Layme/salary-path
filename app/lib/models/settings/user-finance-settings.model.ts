import type { CurrencyCodeValue } from "@/app/lib/models/common/domain-enums"
import type { WorkSchedule } from "@/app/lib/models/work-schedule/work-schedule.model"

export interface UserFinanceSettingsEntity {
  id: string
  ownerUserId: string
  currency: CurrencyCodeValue
  locale: string
  monthlyWorkHours: number
  workDaysPerYear: number
  defaultWorkSchedule: WorkSchedule
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface UserFinanceSettingsCreateInput {
  currency: string
  locale: string
  monthlyWorkHours?: number
  workDaysPerYear?: number
  defaultWorkSchedule?: WorkSchedule
}

export interface UserFinanceSettingsUpdateInput {
  currency?: string
  locale?: string
  monthlyWorkHours?: number
  workDaysPerYear?: number
  defaultWorkSchedule?: WorkSchedule
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
