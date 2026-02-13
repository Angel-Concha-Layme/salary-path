ALTER TABLE "path_companies" ADD COLUMN "color" text NOT NULL DEFAULT '#0F766E';
--> statement-breakpoint
UPDATE "path_companies"
SET "color" = CASE ABS(RANDOM()) % 8
  WHEN 0 THEN '#0F766E'
  WHEN 1 THEN '#0369A1'
  WHEN 2 THEN '#1D4ED8'
  WHEN 3 THEN '#166534'
  WHEN 4 THEN '#B45309'
  WHEN 5 THEN '#C2410C'
  WHEN 6 THEN '#BE123C'
  ELSE '#475569'
END;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "path_company_events_new" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "path_company_id" text NOT NULL,
  "event_type" text NOT NULL,
  "effective_date" integer NOT NULL,
  "amount" real NOT NULL,
  "notes" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  FOREIGN KEY ("path_company_id") REFERENCES "path_companies"("id") ON DELETE CASCADE,
  CONSTRAINT "path_company_events_amount_non_negative" CHECK ("amount" >= 0),
  CONSTRAINT "path_company_events_event_type_check" CHECK (
    "event_type" IN ('start_rate', 'rate_increase', 'annual_increase', 'mid_year_increase', 'promotion')
  )
);
--> statement-breakpoint

INSERT INTO "path_company_events_new" (
  "id",
  "owner_user_id",
  "path_company_id",
  "event_type",
  "effective_date",
  "amount",
  "notes",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  "id",
  "owner_user_id",
  "path_company_id",
  CASE
    WHEN "event_type" = 'start_rate' THEN 'start_rate'
    WHEN "event_type" = 'rate_increase' THEN 'rate_increase'
    WHEN "event_type" = 'annual_increase' THEN 'annual_increase'
    WHEN "event_type" = 'mid_year_increase' THEN 'mid_year_increase'
    WHEN "event_type" = 'promotion' THEN 'promotion'
    WHEN "event_type" = 'annual' THEN 'annual_increase'
    ELSE 'rate_increase'
  END AS "event_type",
  "effective_date",
  "amount",
  "notes",
  "created_at",
  "updated_at",
  "deleted_at"
FROM "path_company_events";
--> statement-breakpoint

DROP TABLE "path_company_events";
--> statement-breakpoint
ALTER TABLE "path_company_events_new" RENAME TO "path_company_events";
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "path_company_events_owner_idx" ON "path_company_events" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_path_company_idx" ON "path_company_events" ("path_company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_effective_date_idx" ON "path_company_events" ("effective_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_deleted_idx" ON "path_company_events" ("deleted_at");
