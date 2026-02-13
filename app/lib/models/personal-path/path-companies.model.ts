export interface PathCompaniesEntity {
  id: string
  ownerUserId: string
  companyCatalogId: string | null
  roleCatalogId: string | null
  color: string
  displayName: string
  roleDisplayName: string
  compensationType: "hourly" | "monthly"
  currency: string
  score: number
  review: string
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PathCompaniesCreateInput {
  companyCatalogId?: string | null
  roleCatalogId?: string | null
  companyName?: string
  roleName?: string
  displayName?: string
  roleDisplayName?: string
  color?: string
  compensationType?: "hourly" | "monthly"
  currency?: string
  score?: number
  review?: string
  startDate: string
  endDate?: string | null
}

export interface PathCompaniesUpdateInput {
  companyCatalogId?: string | null
  roleCatalogId?: string | null
  companyName?: string
  roleName?: string
  displayName?: string
  roleDisplayName?: string
  color?: string
  compensationType?: "hourly" | "monthly"
  currency?: string
  score?: number
  review?: string
  startDate?: string
  endDate?: string | null
}

export interface PathCompaniesListParams {
  limit?: number
}

export interface PathCompaniesListResponse {
  items: PathCompaniesEntity[]
  total: number
}

export interface PathCompaniesDeleteResponse {
  id: string
  deletedAt: string
}
