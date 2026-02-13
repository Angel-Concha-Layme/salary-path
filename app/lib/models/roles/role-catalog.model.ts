export interface RoleCatalogEntity {
  id: string
  ownerUserId: string
  name: string
  nameNormalized: string
  slug: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface RoleCatalogCreateInput {
  name: string
  slug?: string
}

export interface RoleCatalogUpdateInput {
  name?: string
  slug?: string
}

export interface RoleCatalogListParams {
  limit?: number
  search?: string
}

export interface RoleCatalogListResponse {
  items: RoleCatalogEntity[]
  total: number
}

export interface RoleCatalogDeleteResponse {
  id: string
  deletedAt: string
}
