export interface PersonaBonusRuleMonthsEntity {
  id: string
  bonusRuleId: string
  month: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PersonaBonusRuleMonthsCreateInput {
  month: number
}

export interface PersonaBonusRuleMonthsUpdateInput {
  month?: number
}

export interface PersonaBonusRuleMonthsListParams {
  limit?: number
}

export interface PersonaBonusRuleMonthsListResponse {
  items: PersonaBonusRuleMonthsEntity[]
  total: number
}

export interface PersonaBonusRuleMonthsDeleteResponse {
  id: string
  deletedAt: string
}
