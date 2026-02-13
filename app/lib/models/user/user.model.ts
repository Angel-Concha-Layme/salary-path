export interface UserEntity {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export interface UserCreateInput {
  email: string
  name: string
  role: string
}

export interface UserUpdateInput {
  email?: string
  name?: string
  role?: string
}

export interface UserListParams {
  limit?: number
}

export interface UserListResponse {
  items: UserEntity[]
  total: number
}

export interface UserDeleteResponse {
  id: string
  deletedAt: string
}

export interface MeUser {
  id: string
  email: string
  name: string
  role: string
  onboardingCompletedAt: string | null
}

export interface MeResponse {
  source: "jwt" | "cookie"
  user: MeUser
}

export interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

export interface AdminUsersResponse {
  users: AdminUser[]
  total: number
  protected: boolean
  scope: string
}
