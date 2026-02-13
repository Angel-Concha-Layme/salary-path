export interface CompanyCatalogEntity {
  id: string
  ownerUserId: string
  name: string
  nameNormalized: string
  slug: string
  industry: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CompanyCatalogCreateInput {
  name: string
  slug?: string
  industry?: string | null
}

export interface CompanyCatalogUpdateInput {
  name?: string
  slug?: string
  industry?: string | null
}

export interface CompanyCatalogListParams {
  limit?: number
  search?: string
}

export interface CompanyCatalogListResponse {
  items: CompanyCatalogEntity[]
  total: number
}

export interface CompanyCatalogDeleteResponse {
  id: string
  deletedAt: string
}
