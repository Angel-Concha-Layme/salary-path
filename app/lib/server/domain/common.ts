import { ApiError } from "@/app/lib/server/api-error"

export function clampLimit(limit: number | undefined, fallback = 50, max = 100): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return fallback
  }

  return Math.max(1, Math.min(max, Math.trunc(limit)))
}

export function toIso(value: Date | string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(500, "INVALID_DATE", "Invalid date value returned by database")
  }

  return parsed.toISOString()
}

export function requirePatchPayload<T extends Record<string, unknown>>(payload: T): T {
  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, "BAD_REQUEST", "At least one field is required for update")
  }

  return payload
}

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase()
}

export function toSlug(value: string): string {
  return normalizeSearchText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
