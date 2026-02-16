export const pathCompanyEventTypeOptions = [
  "start_rate",
  "rate_increase",
  "annual_increase",
  "mid_year_increase",
  "promotion",
  "end_of_employment",
] as const

export type PathCompanyEventType = (typeof pathCompanyEventTypeOptions)[number]

export interface PathCompanyEventsEntity {
  id: string
  ownerUserId: string
  pathCompanyId: string
  eventType: PathCompanyEventType
  effectiveDate: string
  amount: number
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PathCompanyEventsCreateInput {
  eventType: PathCompanyEventType
  effectiveDate: string
  amount: number
  notes?: string | null
}

export interface PathCompanyEventsUpdateInput {
  eventType?: PathCompanyEventType
  effectiveDate?: string
  amount?: number
  notes?: string | null
}

export interface PathCompanyEventsListParams {
  limit?: number
}

export interface PathCompanyEventsListResponse {
  items: PathCompanyEventsEntity[]
  total: number
}

export interface PathCompanyEventsDeleteResponse {
  id: string
  deletedAt: string
}
