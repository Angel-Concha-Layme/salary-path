import { desc, sql } from "drizzle-orm"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { user } from "@/app/lib/db/schema/auth"

export const routeEmailOtpChallenges = sqliteTable(
  "route_email_otp_challenges",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    routeKey: text("route_key").notNull(),
    codeHash: text("code_hash").notNull(),
    codeSalt: text("code_salt").notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    invalidatedAt: integer("invalidated_at", { mode: "timestamp_ms" }),
    consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("route_email_otp_challenges_owner_route_created_idx").on(
      table.ownerUserId,
      table.routeKey,
      desc(table.createdAt)
    ),
    index("route_email_otp_challenges_owner_route_expires_idx").on(
      table.ownerUserId,
      table.routeKey,
      table.expiresAt
    ),
    index("route_email_otp_challenges_expires_idx").on(table.expiresAt),
  ]
)

export const routeAccessGrants = sqliteTable(
  "route_access_grants",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    routeKey: text("route_key").notNull(),
    method: text("method").notNull(),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("route_access_grants_owner_route_method_unique").on(
      table.ownerUserId,
      table.routeKey,
      table.method
    ),
    index("route_access_grants_expires_idx").on(table.expiresAt),
  ]
)
