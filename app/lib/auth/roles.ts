export type AppRole = "user" | "admin"

const ADMIN_TOKEN = "admin"

function extractTokens(role: unknown): string[] {
  if (typeof role !== "string") {
    return []
  }

  return role
    .split(/[\s,|]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
}

export function hasAdminRole(role: unknown): boolean {
  return extractTokens(role).includes(ADMIN_TOKEN)
}

export function normalizeRole(role: unknown): AppRole {
  return hasAdminRole(role) ? "admin" : "user"
}

export function ensureAdminRole(role: string | null | undefined): string {
  if (hasAdminRole(role)) {
    return role ?? ADMIN_TOKEN
  }

  if (!role || role.trim().length === 0) {
    return ADMIN_TOKEN
  }

  return `${role},${ADMIN_TOKEN}`
}
