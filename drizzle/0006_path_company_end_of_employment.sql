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
    WHEN "event_type" = 'end_of_employment' THEN 'end_of_employment'
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
--> statement-breakpoint

INSERT INTO "path_company_events" (
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
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-' ||
  '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
  'a' || substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6))) AS "id",
  candidates.owner_user_id,
  candidates.path_company_id,
  'end_of_employment' AS "event_type",
  candidates.end_date AS "effective_date",
  candidates.amount AS "amount",
  NULL AS "notes",
  unixepoch() * 1000 AS "created_at",
  unixepoch() * 1000 AS "updated_at",
  NULL AS "deleted_at"
FROM (
  SELECT
    pc.owner_user_id,
    pc.id AS path_company_id,
    pc.end_date,
    COALESCE(
      (
        SELECT pce.amount
        FROM "path_company_events" AS pce
        WHERE pce.owner_user_id = pc.owner_user_id
          AND pce.path_company_id = pc.id
          AND pce.deleted_at IS NULL
          AND pce.event_type <> 'end_of_employment'
          AND pce.effective_date <= pc.end_date
        ORDER BY
          pce.effective_date DESC,
          pce.updated_at DESC,
          pce.created_at DESC,
          pce.id DESC
        LIMIT 1
      ),
      (
        SELECT pce.amount
        FROM "path_company_events" AS pce
        WHERE pce.owner_user_id = pc.owner_user_id
          AND pce.path_company_id = pc.id
          AND pce.deleted_at IS NULL
          AND pce.event_type <> 'end_of_employment'
        ORDER BY
          pce.effective_date DESC,
          pce.updated_at DESC,
          pce.created_at DESC,
          pce.id DESC
        LIMIT 1
      )
    ) AS amount
  FROM "path_companies" AS pc
  WHERE pc.deleted_at IS NULL
    AND pc.end_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "path_company_events" AS existing
      WHERE existing.owner_user_id = pc.owner_user_id
        AND existing.path_company_id = pc.id
        AND existing.deleted_at IS NULL
        AND existing.event_type = 'end_of_employment'
    )
) AS candidates
WHERE candidates.amount IS NOT NULL;
