PRAGMA foreign_keys = OFF;
--> statement-breakpoint

DROP TRIGGER IF EXISTS "path_companies_compensation_type_insert_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "path_companies_compensation_type_update_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "path_companies_currency_insert_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "path_companies_currency_update_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "user_finance_settings_currency_insert_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "user_finance_settings_currency_update_check";
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_finance_settings_new" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "locale" text NOT NULL DEFAULT 'es',
  "monthly_work_hours" integer NOT NULL DEFAULT 174,
  "work_days_per_year" integer NOT NULL DEFAULT 261,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_finance_settings_monthly_work_hours_positive" CHECK ("monthly_work_hours" > 0),
  CONSTRAINT "user_finance_settings_work_days_per_year_range" CHECK ("work_days_per_year" BETWEEN 1 AND 366)
);
--> statement-breakpoint

INSERT INTO "user_finance_settings_new" (
  "id",
  "owner_user_id",
  "currency",
  "locale",
  "monthly_work_hours",
  "work_days_per_year",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  "id",
  "owner_user_id",
  CASE
    WHEN upper(trim("currency")) IN (SELECT "code" FROM "currency_catalog") THEN upper(trim("currency"))
    ELSE 'USD'
  END AS "currency",
  COALESCE(NULLIF(trim("locale"), ''), 'es') AS "locale",
  CASE
    WHEN "monthly_work_hours" > 0 THEN "monthly_work_hours"
    ELSE 174
  END AS "monthly_work_hours",
  CASE
    WHEN "work_days_per_year" BETWEEN 1 AND 366 THEN "work_days_per_year"
    ELSE 261
  END AS "work_days_per_year",
  "created_at",
  "updated_at",
  "deleted_at"
FROM "user_finance_settings";
--> statement-breakpoint

DROP TABLE "user_finance_settings";
--> statement-breakpoint
ALTER TABLE "user_finance_settings_new" RENAME TO "user_finance_settings";
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "user_finance_settings_owner_active_unique"
  ON "user_finance_settings" ("owner_user_id")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_finance_settings_owner_deleted_idx"
  ON "user_finance_settings" ("owner_user_id", "deleted_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "path_companies_new" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "company_catalog_id" text,
  "role_catalog_id" text,
  "color" text NOT NULL DEFAULT '#0F766E',
  "display_name" text NOT NULL,
  "role_display_name" text NOT NULL DEFAULT '',
  "compensation_type" text NOT NULL DEFAULT 'monthly',
  "currency" text NOT NULL DEFAULT 'USD',
  "score" integer NOT NULL DEFAULT 5,
  "review" text NOT NULL DEFAULT '',
  "start_date" integer NOT NULL,
  "end_date" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  FOREIGN KEY ("company_catalog_id") REFERENCES "company_catalog"("id") ON DELETE SET NULL,
  FOREIGN KEY ("role_catalog_id") REFERENCES "role_catalog"("id") ON DELETE SET NULL,
  CONSTRAINT "path_companies_compensation_type_check" CHECK ("compensation_type" IN ('hourly', 'monthly')),
  CONSTRAINT "path_companies_date_consistency" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
  CONSTRAINT "path_companies_score_range" CHECK ("score" BETWEEN 1 AND 10),
  CONSTRAINT "path_companies_review_length" CHECK (length("review") <= 1000),
  CONSTRAINT "path_companies_color_hex" CHECK (
    "color" GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'
  )
);
--> statement-breakpoint

INSERT INTO "path_companies_new" (
  "id",
  "owner_user_id",
  "company_catalog_id",
  "role_catalog_id",
  "color",
  "display_name",
  "role_display_name",
  "compensation_type",
  "currency",
  "score",
  "review",
  "start_date",
  "end_date",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  pc."id",
  pc."owner_user_id",
  pc."company_catalog_id",
  pc."role_catalog_id",
  CASE
    WHEN pc."color" GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]' THEN upper(pc."color")
    ELSE '#0F766E'
  END AS "color",
  pc."display_name",
  COALESCE(pc."role_display_name", '') AS "role_display_name",
  CASE
    WHEN lower(trim(pc."compensation_type")) = 'hourly' THEN 'hourly'
    ELSE 'monthly'
  END AS "compensation_type",
  CASE
    WHEN upper(trim(pc."currency")) IN (SELECT "code" FROM "currency_catalog") THEN upper(trim(pc."currency"))
    ELSE 'USD'
  END AS "currency",
  CASE
    WHEN pc."score" BETWEEN 1 AND 10 THEN pc."score"
    ELSE 5
  END AS "score",
  substr(COALESCE(pc."review", ''), 1, 1000) AS "review",
  pc."start_date",
  CASE
    WHEN pc."end_date" IS NULL OR pc."end_date" >= pc."start_date" THEN pc."end_date"
    ELSE NULL
  END AS "end_date",
  pc."created_at",
  pc."updated_at",
  pc."deleted_at"
FROM "path_companies" AS pc;
--> statement-breakpoint

DROP TABLE "path_companies";
--> statement-breakpoint
ALTER TABLE "path_companies_new" RENAME TO "path_companies";
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "path_companies_owner_idx" ON "path_companies" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_owner_deleted_start_date_idx"
  ON "path_companies" ("owner_user_id", "deleted_at", "start_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_company_catalog_idx"
  ON "path_companies" ("company_catalog_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_role_catalog_idx"
  ON "path_companies" ("role_catalog_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_deleted_idx" ON "path_companies" ("deleted_at");
--> statement-breakpoint

CREATE TRIGGER IF NOT EXISTS "path_companies_currency_insert_check"
BEFORE INSERT ON "path_companies"
FOR EACH ROW
WHEN NEW.currency IS NULL
  OR upper(trim(NEW.currency)) NOT IN (SELECT code FROM currency_catalog)
BEGIN
  SELECT RAISE(ABORT, 'invalid currency');
END;
--> statement-breakpoint

CREATE TRIGGER IF NOT EXISTS "path_companies_currency_update_check"
BEFORE UPDATE OF "currency" ON "path_companies"
FOR EACH ROW
WHEN NEW.currency IS NULL
  OR upper(trim(NEW.currency)) NOT IN (SELECT code FROM currency_catalog)
BEGIN
  SELECT RAISE(ABORT, 'invalid currency');
END;
--> statement-breakpoint

CREATE TRIGGER IF NOT EXISTS "user_finance_settings_currency_insert_check"
BEFORE INSERT ON "user_finance_settings"
FOR EACH ROW
WHEN NEW.currency IS NULL
  OR upper(trim(NEW.currency)) NOT IN (SELECT code FROM currency_catalog)
BEGIN
  SELECT RAISE(ABORT, 'invalid currency');
END;
--> statement-breakpoint

CREATE TRIGGER IF NOT EXISTS "user_finance_settings_currency_update_check"
BEFORE UPDATE OF "currency" ON "user_finance_settings"
FOR EACH ROW
WHEN NEW.currency IS NULL
  OR upper(trim(NEW.currency)) NOT IN (SELECT code FROM currency_catalog)
BEGIN
  SELECT RAISE(ABORT, 'invalid currency');
END;
--> statement-breakpoint

PRAGMA foreign_keys = ON;
