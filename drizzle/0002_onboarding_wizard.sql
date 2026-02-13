ALTER TABLE "user" ADD COLUMN "onboarding_completed_at" integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_onboarding_completed_idx" ON "user" ("onboarding_completed_at");
--> statement-breakpoint

ALTER TABLE "user_finance_settings" ADD COLUMN "monthly_work_hours" integer NOT NULL DEFAULT 174;
--> statement-breakpoint
ALTER TABLE "user_finance_settings" ADD COLUMN "work_days_per_year" integer NOT NULL DEFAULT 261;
--> statement-breakpoint

ALTER TABLE "company_catalog" ADD COLUMN "name_normalized" text NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE "company_catalog"
SET "name_normalized" = lower(trim("name"))
WHERE "name_normalized" = '';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_catalog_slug_unique" ON "company_catalog" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_catalog_name_normalized_deleted_idx"
  ON "company_catalog" ("name_normalized", "deleted_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "role_catalog" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "name" text NOT NULL,
  "name_normalized" text NOT NULL,
  "slug" text NOT NULL,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "role_catalog_slug_unique" ON "role_catalog" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_catalog_name_normalized_deleted_idx"
  ON "role_catalog" ("name_normalized", "deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_catalog_deleted_idx" ON "role_catalog" ("deleted_at");
--> statement-breakpoint

ALTER TABLE "path_companies" ADD COLUMN "role_catalog_id" text REFERENCES "role_catalog"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "path_companies" ADD COLUMN "role_display_name" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "path_companies" ADD COLUMN "compensation_type" text NOT NULL DEFAULT 'monthly';
--> statement-breakpoint
ALTER TABLE "path_companies" ADD COLUMN "currency" text NOT NULL DEFAULT 'USD';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_role_catalog_idx" ON "path_companies" ("role_catalog_id");
--> statement-breakpoint

UPDATE "path_companies"
SET "role_display_name" = "display_name"
WHERE "role_display_name" = '';
