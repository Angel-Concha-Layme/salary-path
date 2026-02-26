CREATE TABLE IF NOT EXISTS "user_work_schedule_days" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "is_working_day" integer NOT NULL DEFAULT 0,
  "start_minute" integer,
  "end_minute" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_work_schedule_days_day_of_week_range" CHECK ("day_of_week" BETWEEN 1 AND 7),
  CONSTRAINT "user_work_schedule_days_is_working_day_boolean" CHECK ("is_working_day" IN (0, 1)),
  CONSTRAINT "user_work_schedule_days_start_minute_range" CHECK ("start_minute" IS NULL OR "start_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "user_work_schedule_days_end_minute_range" CHECK ("end_minute" IS NULL OR "end_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "user_work_schedule_days_consistency" CHECK (
    (
      "is_working_day" = 0
      AND "start_minute" IS NULL
      AND "end_minute" IS NULL
    ) OR (
      "is_working_day" = 1
      AND "start_minute" IS NOT NULL
      AND "end_minute" IS NOT NULL
      AND "end_minute" > "start_minute"
    )
  )
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "user_work_schedule_days_owner_day_active_unique"
  ON "user_work_schedule_days" ("owner_user_id", "day_of_week")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_work_schedule_days_owner_deleted_idx"
  ON "user_work_schedule_days" ("owner_user_id", "deleted_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "path_company_work_schedule_days" (
  "id" text PRIMARY KEY NOT NULL,
  "path_company_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "is_working_day" integer NOT NULL DEFAULT 0,
  "start_minute" integer,
  "end_minute" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("path_company_id") REFERENCES "path_companies"("id") ON DELETE CASCADE,
  CONSTRAINT "path_company_work_schedule_days_day_of_week_range" CHECK ("day_of_week" BETWEEN 1 AND 7),
  CONSTRAINT "path_company_work_schedule_days_is_working_day_boolean" CHECK ("is_working_day" IN (0, 1)),
  CONSTRAINT "path_company_work_schedule_days_start_minute_range" CHECK ("start_minute" IS NULL OR "start_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "path_company_work_schedule_days_end_minute_range" CHECK ("end_minute" IS NULL OR "end_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "path_company_work_schedule_days_consistency" CHECK (
    (
      "is_working_day" = 0
      AND "start_minute" IS NULL
      AND "end_minute" IS NULL
    ) OR (
      "is_working_day" = 1
      AND "start_minute" IS NOT NULL
      AND "end_minute" IS NOT NULL
      AND "end_minute" > "start_minute"
    )
  )
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "path_company_work_schedule_days_company_day_active_unique"
  ON "path_company_work_schedule_days" ("path_company_id", "day_of_week")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_work_schedule_days_company_deleted_idx"
  ON "path_company_work_schedule_days" ("path_company_id", "deleted_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_monthly_income_sources" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "month_start" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "source_type" text NOT NULL,
  "path_company_id" text,
  "company_name_snapshot" text,
  "computed_amount" real NOT NULL DEFAULT 0,
  "final_amount" real NOT NULL DEFAULT 0,
  "is_user_edited" integer NOT NULL DEFAULT 0,
  "note" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  FOREIGN KEY ("path_company_id") REFERENCES "path_companies"("id") ON DELETE SET NULL,
  CONSTRAINT "user_monthly_income_sources_source_type_check" CHECK ("source_type" IN ('employment', 'bonus', 'extra_income', 'adjustment')),
  CONSTRAINT "user_monthly_income_sources_is_user_edited_boolean" CHECK ("is_user_edited" IN (0, 1)),
  CONSTRAINT "user_monthly_income_sources_employment_requires_company" CHECK (("source_type" != 'employment') OR ("path_company_id" IS NOT NULL))
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "user_monthly_income_sources_owner_deleted_month_idx"
  ON "user_monthly_income_sources" ("owner_user_id", "deleted_at", "month_start");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_monthly_income_sources_company_deleted_month_idx"
  ON "user_monthly_income_sources" ("path_company_id", "deleted_at", "month_start");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_monthly_income_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "month_start" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "employment_computed_total" real NOT NULL DEFAULT 0,
  "employment_final_total" real NOT NULL DEFAULT 0,
  "bonus_total" real NOT NULL DEFAULT 0,
  "extra_income_total" real NOT NULL DEFAULT 0,
  "adjustment_total" real NOT NULL DEFAULT 0,
  "final_total" real NOT NULL DEFAULT 0,
  "is_adjusted" integer NOT NULL DEFAULT 0,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_monthly_income_snapshots_is_adjusted_boolean" CHECK ("is_adjusted" IN (0, 1))
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "user_monthly_income_snapshots_owner_month_currency_active_unique"
  ON "user_monthly_income_snapshots" ("owner_user_id", "month_start", "currency")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_monthly_income_snapshots_owner_deleted_month_idx"
  ON "user_monthly_income_snapshots" ("owner_user_id", "deleted_at", "month_start");
