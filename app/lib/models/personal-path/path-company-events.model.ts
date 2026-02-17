import {
  pathCompanyEventTypeOptions,
  type PathCompanyEventTypeValue,
} from "@/app/lib/models/common/domain-enums"

export { pathCompanyEventTypeOptions }

export type PathCompanyEventType = PathCompanyEventTypeValue

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
