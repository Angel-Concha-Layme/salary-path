export interface PersonaCareerEventsEntity {
  id: string
  personaId: string
  eventDate: string
  title: string
  salaryAmount: number
  rateAmount: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PersonaCareerEventsCreateInput {
  eventDate: string
  title: string
  salaryAmount: number
  rateAmount?: number | null
}

export interface PersonaCareerEventsUpdateInput {
  eventDate?: string
  title?: string
  salaryAmount?: number
  rateAmount?: number | null
}

export interface PersonaCareerEventsListParams {
  limit?: number
}

export interface PersonaCareerEventsListResponse {
  items: PersonaCareerEventsEntity[]
  total: number
}

export interface PersonaCareerEventsDeleteResponse {
  id: string
  deletedAt: string
}
