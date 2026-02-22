PRAGMA foreign_keys = OFF;
--> statement-breakpoint

DROP TRIGGER IF EXISTS "path_company_events_event_type_insert_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "path_company_events_event_type_update_check";
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "path_company_events_new" (
  "id" text PRIMARY KEY NOT NULL,
  "path_company_id" text NOT NULL,
  "event_type" text NOT NULL,
  "effective_date" integer NOT NULL,
  "amount" real NOT NULL,
  "notes" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("path_company_id") REFERENCES "path_companies"("id") ON DELETE CASCADE,
  CONSTRAINT "path_company_events_amount_non_negative" CHECK ("amount" >= 0),
  CONSTRAINT "path_company_events_event_type_check" CHECK (
    "event_type" IN (
      'start_rate',
      'rate_increase',
      'annual_increase',
      'mid_year_increase',
      'promotion',
      'end_of_employment'
    )
  )
);
--> statement-breakpoint

INSERT INTO "path_company_events_new" (
  "id",
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
  "path_company_id",
  "event_type",
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

CREATE INDEX IF NOT EXISTS "path_company_events_path_company_idx"
  ON "path_company_events" ("path_company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_path_company_deleted_effective_idx"
  ON "path_company_events" ("path_company_id", "deleted_at", "effective_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_deleted_effective_idx"
  ON "path_company_events" ("deleted_at", "effective_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_effective_date_idx"
  ON "path_company_events" ("effective_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_deleted_idx"
  ON "path_company_events" ("deleted_at");
--> statement-breakpoint

PRAGMA foreign_keys = ON;
