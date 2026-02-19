CREATE TABLE IF NOT EXISTS "route_email_otp_challenges" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "route_key" text NOT NULL,
  "code_hash" text NOT NULL,
  "code_salt" text NOT NULL,
  "attempt_count" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 5,
  "expires_at" integer NOT NULL,
  "invalidated_at" integer,
  "consumed_at" integer,
  "ip_address" text,
  "user_agent" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK ("attempt_count" >= 0),
  CHECK ("max_attempts" > 0),
  CHECK ("attempt_count" <= "max_attempts"),
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_email_otp_challenges_owner_route_created_idx" ON "route_email_otp_challenges" ("owner_user_id", "route_key", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_email_otp_challenges_owner_route_expires_idx" ON "route_email_otp_challenges" ("owner_user_id", "route_key", "expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_email_otp_challenges_expires_idx" ON "route_email_otp_challenges" ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_access_grants" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "route_key" text NOT NULL,
  "method" text NOT NULL,
  "verified_at" integer NOT NULL,
  "expires_at" integer NOT NULL,
  "revoked_at" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "route_access_grants_owner_route_method_unique" ON "route_access_grants" ("owner_user_id", "route_key", "method");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_access_grants_expires_idx" ON "route_access_grants" ("expires_at");
