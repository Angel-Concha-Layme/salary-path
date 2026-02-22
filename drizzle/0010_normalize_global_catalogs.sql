PRAGMA foreign_keys = OFF;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "company_catalog_new" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "name_normalized" text NOT NULL,
  "slug" text NOT NULL,
  "industry" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "role_catalog_new" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "name_normalized" text NOT NULL,
  "slug" text NOT NULL,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "__company_catalog_map" (
  "name_normalized" text PRIMARY KEY NOT NULL,
  "catalog_id" text NOT NULL
);
--> statement-breakpoint

INSERT INTO "__company_catalog_map" ("name_normalized", "catalog_id")
SELECT
  names.name_normalized,
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-' ||
  '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', (abs(random()) % 4) + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6))) AS catalog_id
FROM (
  SELECT DISTINCT lower(trim(pc."display_name")) AS name_normalized
  FROM "path_companies" AS pc
  WHERE pc."deleted_at" IS NULL
    AND trim(pc."display_name") <> ''
) AS names;
--> statement-breakpoint

INSERT INTO "company_catalog_new" (
  "id",
  "name",
  "name_normalized",
  "slug",
  "industry",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  map."catalog_id" AS id,
  (
    SELECT pc."display_name"
    FROM "path_companies" AS pc
    WHERE pc."deleted_at" IS NULL
      AND lower(trim(pc."display_name")) = map."name_normalized"
    ORDER BY pc."start_date" ASC, pc."created_at" ASC, pc."id" ASC
    LIMIT 1
  ) AS name,
  map."name_normalized" AS name_normalized,
  ('company-' || substr(map."catalog_id", 1, 8)) AS slug,
  NULL AS industry,
  COALESCE(
    (
      SELECT MIN(pc."created_at")
      FROM "path_companies" AS pc
      WHERE pc."deleted_at" IS NULL
        AND lower(trim(pc."display_name")) = map."name_normalized"
    ),
    unixepoch() * 1000
  ) AS created_at,
  COALESCE(
    (
      SELECT MAX(pc."updated_at")
      FROM "path_companies" AS pc
      WHERE pc."deleted_at" IS NULL
        AND lower(trim(pc."display_name")) = map."name_normalized"
    ),
    unixepoch() * 1000
  ) AS updated_at,
  NULL AS deleted_at
FROM "__company_catalog_map" AS map;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "__role_catalog_map" (
  "name_normalized" text PRIMARY KEY NOT NULL,
  "catalog_id" text NOT NULL
);
--> statement-breakpoint

INSERT INTO "__role_catalog_map" ("name_normalized", "catalog_id")
SELECT
  names.name_normalized,
  lower(hex(randomblob(4))) || '-' ||
  lower(hex(randomblob(2))) || '-' ||
  '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
  substr('89ab', (abs(random()) % 4) + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
  lower(hex(randomblob(6))) AS catalog_id
FROM (
  SELECT DISTINCT lower(trim(pc."role_display_name")) AS name_normalized
  FROM "path_companies" AS pc
  WHERE pc."deleted_at" IS NULL
    AND trim(pc."role_display_name") <> ''
) AS names;
--> statement-breakpoint

INSERT INTO "role_catalog_new" (
  "id",
  "name",
  "name_normalized",
  "slug",
  "created_at",
  "updated_at",
  "deleted_at"
)
SELECT
  map."catalog_id" AS id,
  (
    SELECT pc."role_display_name"
    FROM "path_companies" AS pc
    WHERE pc."deleted_at" IS NULL
      AND lower(trim(pc."role_display_name")) = map."name_normalized"
    ORDER BY pc."start_date" ASC, pc."created_at" ASC, pc."id" ASC
    LIMIT 1
  ) AS name,
  map."name_normalized" AS name_normalized,
  ('role-' || substr(map."catalog_id", 1, 8)) AS slug,
  COALESCE(
    (
      SELECT MIN(pc."created_at")
      FROM "path_companies" AS pc
      WHERE pc."deleted_at" IS NULL
        AND lower(trim(pc."role_display_name")) = map."name_normalized"
    ),
    unixepoch() * 1000
  ) AS created_at,
  COALESCE(
    (
      SELECT MAX(pc."updated_at")
      FROM "path_companies" AS pc
      WHERE pc."deleted_at" IS NULL
        AND lower(trim(pc."role_display_name")) = map."name_normalized"
    ),
    unixepoch() * 1000
  ) AS updated_at,
  NULL AS deleted_at
FROM "__role_catalog_map" AS map;
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
  FOREIGN KEY ("company_catalog_id") REFERENCES "company_catalog_new"("id") ON DELETE SET NULL,
  FOREIGN KEY ("role_catalog_id") REFERENCES "role_catalog_new"("id") ON DELETE SET NULL,
  CONSTRAINT "path_companies_date_consistency" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
  CONSTRAINT "path_companies_score_range" CHECK ("score" BETWEEN 1 AND 10),
  CONSTRAINT "path_companies_review_length" CHECK (length("review") <= 1000)
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
  company_map."catalog_id" AS company_catalog_id,
  role_map."catalog_id" AS role_catalog_id,
  pc."color",
  pc."display_name",
  pc."role_display_name",
  pc."compensation_type",
  pc."currency",
  pc."score",
  pc."review",
  pc."start_date",
  pc."end_date",
  pc."created_at",
  pc."updated_at",
  pc."deleted_at"
FROM "path_companies" AS pc
LEFT JOIN "__company_catalog_map" AS company_map
  ON company_map."name_normalized" = lower(trim(pc."display_name"))
LEFT JOIN "__role_catalog_map" AS role_map
  ON role_map."name_normalized" = lower(trim(pc."role_display_name"));
--> statement-breakpoint

DROP TABLE "path_companies";
--> statement-breakpoint
ALTER TABLE "path_companies_new" RENAME TO "path_companies";
--> statement-breakpoint

DROP TABLE "company_catalog";
--> statement-breakpoint
DROP TABLE "role_catalog";
--> statement-breakpoint
ALTER TABLE "company_catalog_new" RENAME TO "company_catalog";
--> statement-breakpoint
ALTER TABLE "role_catalog_new" RENAME TO "role_catalog";
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "company_catalog_slug_unique" ON "company_catalog" ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_catalog_name_normalized_active_unique"
  ON "company_catalog" ("name_normalized")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_catalog_name_normalized_deleted_idx"
  ON "company_catalog" ("name_normalized", "deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_catalog_deleted_idx" ON "company_catalog" ("deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_catalog_deleted_created_idx"
  ON "company_catalog" ("deleted_at", "created_at");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "role_catalog_slug_unique" ON "role_catalog" ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "role_catalog_name_normalized_active_unique"
  ON "role_catalog" ("name_normalized")
  WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_catalog_name_normalized_deleted_idx"
  ON "role_catalog" ("name_normalized", "deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_catalog_deleted_idx" ON "role_catalog" ("deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_catalog_deleted_created_idx"
  ON "role_catalog" ("deleted_at", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "path_companies_owner_idx" ON "path_companies" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_owner_deleted_start_date_idx"
  ON "path_companies" ("owner_user_id", "deleted_at", "start_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_company_catalog_idx" ON "path_companies" ("company_catalog_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_role_catalog_idx" ON "path_companies" ("role_catalog_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_deleted_idx" ON "path_companies" ("deleted_at");
--> statement-breakpoint

DROP TABLE "__company_catalog_map";
--> statement-breakpoint
DROP TABLE "__role_catalog_map";
--> statement-breakpoint

PRAGMA foreign_keys = ON;
