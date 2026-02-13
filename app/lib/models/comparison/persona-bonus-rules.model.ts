export interface PersonaBonusRulesEntity {
  id: string
  personaId: string
  name: string
  bonusType: string
  amount: number
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PersonaBonusRulesCreateInput {
  name: string
  bonusType: string
  amount: number
  startDate: string
  endDate?: string | null
}

export interface PersonaBonusRulesUpdateInput {
  name?: string
  bonusType?: string
  amount?: number
  startDate?: string
  endDate?: string | null
}

export interface PersonaBonusRulesListParams {
  limit?: number
}

export interface PersonaBonusRulesListResponse {
  items: PersonaBonusRulesEntity[]
  total: number
}

export interface PersonaBonusRulesDeleteResponse {
  id: string
  deletedAt: string
}
