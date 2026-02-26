PRAGMA foreign_keys = OFF;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_work_schedule_days_new" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "is_working_day" integer NOT NULL DEFAULT 0,
  "start_minute" integer,
  "end_minute" integer,
  "break_minute" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "user_work_schedule_days_day_of_week_range" CHECK ("day_of_week" BETWEEN 1 AND 7),
  CONSTRAINT "user_work_schedule_days_is_working_day_boolean" CHECK ("is_working_day" IN (0, 1)),
  CONSTRAINT "user_work_schedule_days_start_minute_range" CHECK ("start_minute" IS NULL OR "start_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "user_work_schedule_days_end_minute_range" CHECK ("end_minute" IS NULL OR "end_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "user_work_schedule_days_break_minute_range" CHECK ("break_minute" IS NULL OR "break_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "user_work_schedule_days_consistency" CHECK (
    (
      "is_working_day" = 0
      AND "start_minute" IS NULL
      AND "end_minute" IS NULL
      AND "break_minute" IS NULL
    ) OR (
      "is_working_day" = 1
      AND "start_minute" IS NOT NULL
      AND "end_minute" IS NOT NULL
      AND "break_minute" IS NOT NULL
      AND "end_minute" > "start_minute"
      AND "break_minute" < ("end_minute" - "start_minute")
    )
  )
);
--> statement-breakpoint

INSERT INTO "user_work_schedule_days_new" (
  "id",
  "owner_user_id",
  "day_of_week",
  "is_working_day",
  "start_minute",
  "end_minute",
  "break_minute",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  "id",
  "owner_user_id",
  "day_of_week",
  "is_working_day",
  "start_minute",
  "end_minute",
  CASE
    WHEN "is_working_day" = 1 THEN 0
    ELSE NULL
  END AS "break_minute",
  "created_at",
  "updated_at",
  "deleted_at"
FROM "user_work_schedule_days";
--> statement-breakpoint

DROP TABLE "user_work_schedule_days";
--> statement-breakpoint
ALTER TABLE "user_work_schedule_days_new" RENAME TO "user_work_schedule_days";
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "user_work_schedule_days_owner_day_active_unique"
  ON "user_work_schedule_days" ("owner_user_id", "day_of_week")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_work_schedule_days_owner_deleted_idx"
  ON "user_work_schedule_days" ("owner_user_id", "deleted_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "path_company_work_schedule_days_new" (
  "id" text PRIMARY KEY NOT NULL,
  "path_company_id" text NOT NULL,
  "day_of_week" integer NOT NULL,
  "is_working_day" integer NOT NULL DEFAULT 0,
  "start_minute" integer,
  "end_minute" integer,
  "break_minute" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("path_company_id") REFERENCES "path_companies"("id") ON DELETE CASCADE,
  CONSTRAINT "path_company_work_schedule_days_day_of_week_range" CHECK ("day_of_week" BETWEEN 1 AND 7),
  CONSTRAINT "path_company_work_schedule_days_is_working_day_boolean" CHECK ("is_working_day" IN (0, 1)),
  CONSTRAINT "path_company_work_schedule_days_start_minute_range" CHECK ("start_minute" IS NULL OR "start_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "path_company_work_schedule_days_end_minute_range" CHECK ("end_minute" IS NULL OR "end_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "path_company_work_schedule_days_break_minute_range" CHECK ("break_minute" IS NULL OR "break_minute" BETWEEN 0 AND 1440),
  CONSTRAINT "path_company_work_schedule_days_consistency" CHECK (
    (
      "is_working_day" = 0
      AND "start_minute" IS NULL
      AND "end_minute" IS NULL
      AND "break_minute" IS NULL
    ) OR (
      "is_working_day" = 1
      AND "start_minute" IS NOT NULL
      AND "end_minute" IS NOT NULL
      AND "break_minute" IS NOT NULL
      AND "end_minute" > "start_minute"
      AND "break_minute" < ("end_minute" - "start_minute")
    )
  )
);
--> statement-breakpoint

INSERT INTO "path_company_work_schedule_days_new" (
  "id",
  "path_company_id",
  "day_of_week",
  "is_working_day",
  "start_minute",
  "end_minute",
  "break_minute",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  "id",
  "path_company_id",
  "day_of_week",
  "is_working_day",
  "start_minute",
  "end_minute",
  CASE
    WHEN "is_working_day" = 1 THEN 0
    ELSE NULL
  END AS "break_minute",
  "created_at",
  "updated_at",
  "deleted_at"
FROM "path_company_work_schedule_days";
--> statement-breakpoint

DROP TABLE "path_company_work_schedule_days";
--> statement-breakpoint
ALTER TABLE "path_company_work_schedule_days_new" RENAME TO "path_company_work_schedule_days";
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "path_company_work_schedule_days_company_day_active_unique"
  ON "path_company_work_schedule_days" ("path_company_id", "day_of_week")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_work_schedule_days_company_deleted_idx"
  ON "path_company_work_schedule_days" ("path_company_id", "deleted_at");
--> statement-breakpoint

PRAGMA foreign_keys = ON;
