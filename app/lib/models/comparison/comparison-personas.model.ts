export interface ComparisonPersonasEntity {
  id: string
  ownerUserId: string
  name: string
  title: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ComparisonPersonasCreateInput {
  name: string
  title?: string | null
}

export interface ComparisonPersonasUpdateInput {
  name?: string
  title?: string | null
}

export interface ComparisonPersonasListParams {
  limit?: number
}

export interface ComparisonPersonasListResponse {
  items: ComparisonPersonasEntity[]
  total: number
}

export interface ComparisonPersonasDeleteResponse {
  id: string
  deletedAt: string
}
