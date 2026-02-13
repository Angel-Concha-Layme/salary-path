CREATE TABLE IF NOT EXISTS "user_finance_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "locale" text NOT NULL DEFAULT 'es',
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_finance_settings_owner_unique" ON "user_finance_settings" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_finance_settings_owner_deleted_idx" ON "user_finance_settings" ("owner_user_id", "deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comparison_personas" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "name" text NOT NULL,
  "title" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparison_personas_owner_idx" ON "comparison_personas" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparison_personas_owner_deleted_idx" ON "comparison_personas" ("owner_user_id", "deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_career_events" (
  "id" text PRIMARY KEY NOT NULL,
  "persona_id" text NOT NULL,
  "event_date" integer NOT NULL,
  "title" text NOT NULL,
  "salary_amount" real NOT NULL,
  "rate_amount" real,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("persona_id") REFERENCES "comparison_personas"("id") ON DELETE CASCADE,
  CHECK ("salary_amount" >= 0),
  CHECK ("rate_amount" IS NULL OR "rate_amount" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persona_career_events_persona_idx" ON "persona_career_events" ("persona_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persona_career_events_date_idx" ON "persona_career_events" ("event_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persona_career_events_deleted_idx" ON "persona_career_events" ("deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_bonus_rules" (
  "id" text PRIMARY KEY NOT NULL,
  "persona_id" text NOT NULL,
  "name" text NOT NULL,
  "bonus_type" text NOT NULL,
  "amount" real NOT NULL,
  "start_date" integer NOT NULL,
  "end_date" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("persona_id") REFERENCES "comparison_personas"("id") ON DELETE CASCADE,
  CHECK ("amount" >= 0),
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persona_bonus_rules_persona_idx" ON "persona_bonus_rules" ("persona_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persona_bonus_rules_deleted_idx" ON "persona_bonus_rules" ("deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona_bonus_rule_months" (
  "id" text PRIMARY KEY NOT NULL,
  "bonus_rule_id" text NOT NULL,
  "month" integer NOT NULL,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("bonus_rule_id") REFERENCES "persona_bonus_rules"("id") ON DELETE CASCADE,
  CHECK ("month" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "persona_bonus_rule_months_rule_month_unique" ON "persona_bonus_rule_months" ("bonus_rule_id", "month");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "persona_bonus_rule_months_deleted_idx" ON "persona_bonus_rule_months" ("deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_catalog" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "industry" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "company_catalog_owner_slug_unique" ON "company_catalog" ("owner_user_id", "slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_catalog_owner_idx" ON "company_catalog" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_catalog_deleted_idx" ON "company_catalog" ("deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "path_companies" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_user_id" text NOT NULL,
  "company_catalog_id" text,
  "display_name" text NOT NULL,
  "start_date" integer NOT NULL,
  "end_date" integer,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "deleted_at" integer,
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE,
  FOREIGN KEY ("company_catalog_id") REFERENCES "company_catalog"("id") ON DELETE SET NULL,
  CHECK ("end_date" IS NULL OR "end_date" >= "start_date")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_owner_idx" ON "path_companies" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_company_catalog_idx" ON "path_companies" ("company_catalog_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_companies_deleted_idx" ON "path_companies" ("deleted_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "path_company_events" (
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
  CHECK ("amount" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_owner_idx" ON "path_company_events" ("owner_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_path_company_idx" ON "path_company_events" ("path_company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_effective_date_idx" ON "path_company_events" ("effective_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "path_company_events_deleted_idx" ON "path_company_events" ("deleted_at");
