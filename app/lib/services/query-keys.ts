export interface AdminUsersListParams {
  limit?: number
}

export interface PaginationParams {
  limit?: number
}

export interface CompanyCatalogListParams {
  limit?: number
  search?: string
}

export interface RoleCatalogListParams {
  limit?: number
  search?: string
}

export const queryKeys = {
  me: {
    root: () => ["me"] as const,
    detail: () => ["me", "detail"] as const,
  },
  adminUsers: {
    root: () => ["admin", "users"] as const,
    list: (params: AdminUsersListParams = {}) =>
      ["admin", "users", "list", { limit: params.limit ?? 50 }] as const,
  },
  settings: {
    root: () => ["settings"] as const,
    userFinanceSettings: {
      root: () => ["settings", "finance"] as const,
      list: (params: PaginationParams = {}) =>
        ["settings", "finance", "list", { limit: params.limit ?? 50 }] as const,
      detail: (id: string) => ["settings", "finance", "detail", id] as const,
    },
  },
  profile: {
    root: () => ["profile"] as const,
  },
  companies: {
    root: () => ["companies"] as const,
    companyCatalog: {
      root: () => ["companies", "catalog"] as const,
      list: (params: CompanyCatalogListParams = {}) =>
        ["companies", "catalog", "list", { limit: params.limit ?? 50, search: params.search ?? "" }] as const,
      detail: (companyId: string) => ["companies", "catalog", "detail", companyId] as const,
    },
  },
  roles: {
    root: () => ["roles"] as const,
    roleCatalog: {
      root: () => ["roles", "catalog"] as const,
      list: (params: RoleCatalogListParams = {}) =>
        ["roles", "catalog", "list", { limit: params.limit ?? 50, search: params.search ?? "" }] as const,
      detail: (roleId: string) => ["roles", "catalog", "detail", roleId] as const,
    },
  },
  onboarding: {
    root: () => ["onboarding"] as const,
    status: () => ["onboarding", "status"] as const,
  },
  comparison: {
    root: () => ["comparison"] as const,
    personas: {
      root: () => ["comparison", "personas"] as const,
      list: (params: PaginationParams = {}) =>
        ["comparison", "personas", "list", { limit: params.limit ?? 50 }] as const,
      detail: (personaId: string) => ["comparison", "personas", "detail", personaId] as const,
      careerEvents: {
        root: (personaId: string) => ["comparison", "personas", personaId, "career-events"] as const,
        list: (personaId: string, params: PaginationParams = {}) =>
          [
            "comparison",
            "personas",
            personaId,
            "career-events",
            "list",
            { limit: params.limit ?? 50 },
          ] as const,
        detail: (personaId: string, eventId: string) =>
          ["comparison", "personas", personaId, "career-events", "detail", eventId] as const,
      },
      bonusRules: {
        root: (personaId: string) => ["comparison", "personas", personaId, "bonus-rules"] as const,
        list: (personaId: string, params: PaginationParams = {}) =>
          [
            "comparison",
            "personas",
            personaId,
            "bonus-rules",
            "list",
            { limit: params.limit ?? 50 },
          ] as const,
        detail: (personaId: string, ruleId: string) =>
          ["comparison", "personas", personaId, "bonus-rules", "detail", ruleId] as const,
        months: {
          root: (personaId: string, ruleId: string) =>
            ["comparison", "personas", personaId, "bonus-rules", ruleId, "months"] as const,
          list: (personaId: string, ruleId: string, params: PaginationParams = {}) =>
            [
              "comparison",
              "personas",
              personaId,
              "bonus-rules",
              ruleId,
              "months",
              "list",
              { limit: params.limit ?? 50 },
            ] as const,
          detail: (personaId: string, ruleId: string, monthId: string) =>
            [
              "comparison",
              "personas",
              personaId,
              "bonus-rules",
              ruleId,
              "months",
              "detail",
              monthId,
            ] as const,
        },
      },
    },
  },
  personalPath: {
    root: () => ["personal-path"] as const,
    companyEvents: {
      root: () => ["personal-path", "company-events"] as const,
      list: (params: PaginationParams = {}) =>
        ["personal-path", "company-events", "list", { limit: params.limit ?? 50 }] as const,
    },
    companies: {
      root: () => ["personal-path", "companies"] as const,
      list: (params: PaginationParams = {}) =>
        ["personal-path", "companies", "list", { limit: params.limit ?? 50 }] as const,
      detail: (pathCompanyId: string) =>
        ["personal-path", "companies", "detail", pathCompanyId] as const,
      events: {
        root: (pathCompanyId: string) =>
          ["personal-path", "companies", pathCompanyId, "events"] as const,
        list: (pathCompanyId: string, params: PaginationParams = {}) =>
          [
            "personal-path",
            "companies",
            pathCompanyId,
            "events",
            "list",
            { limit: params.limit ?? 50 },
          ] as const,
        detail: (pathCompanyId: string, eventId: string) =>
          ["personal-path", "companies", pathCompanyId, "events", "detail", eventId] as const,
      },
    },
  },
} as const
