CREATE TABLE IF NOT EXISTS "currency_catalog" (
  "code" text PRIMARY KEY NOT NULL,
  "minor_units" integer NOT NULL DEFAULT 2,
  "created_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updated_at" integer NOT NULL DEFAULT (unixepoch() * 1000),
  CONSTRAINT "currency_catalog_minor_units_range" CHECK ("minor_units" BETWEEN 0 AND 3)
);
--> statement-breakpoint

INSERT OR IGNORE INTO "currency_catalog" (
  "code",
  "minor_units",
  "created_at",
  "updated_at"
)
VALUES
  ('AED', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('AFN', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('ALL', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('AMD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ANG', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('AOA', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ARS', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('AUD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('AWG', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('AZN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BAM', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BBD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BDT', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BGN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BHD', 3, unixepoch() * 1000, unixepoch() * 1000),
  ('BIF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('BMD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BND', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BOB', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BRL', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BSD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BTN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BWP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BYN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('BZD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CAD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CDF', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CHF', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CLP', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('CNY', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('COP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CRC', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CUC', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CUP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CVE', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('CZK', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('DJF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('DKK', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('DOP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('DZD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('EGP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ERN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ETB', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('EUR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('FJD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('FKP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('GBP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('GEL', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('GHS', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('GIP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('GMD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('GNF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('GTQ', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('GYD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('HKD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('HNL', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('HRK', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('HTG', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('HUF', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('IDR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ILS', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('INR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('IQD', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('IRR', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('ISK', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('JMD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('JOD', 3, unixepoch() * 1000, unixepoch() * 1000),
  ('JPY', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('KES', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('KGS', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('KHR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('KMF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('KPW', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('KRW', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('KWD', 3, unixepoch() * 1000, unixepoch() * 1000),
  ('KYD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('KZT', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('LAK', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('LBP', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('LKR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('LRD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('LSL', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('LYD', 3, unixepoch() * 1000, unixepoch() * 1000),
  ('MAD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MDL', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MGA', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('MKD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MMK', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('MNT', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MOP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MRU', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MUR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MVR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MWK', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MXN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MYR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('MZN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('NAD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('NGN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('NIO', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('NOK', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('NPR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('NZD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('OMR', 3, unixepoch() * 1000, unixepoch() * 1000),
  ('PAB', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('PEN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('PGK', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('PHP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('PKR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('PLN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('PYG', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('QAR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('RON', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('RSD', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('RUB', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('RWF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('SAR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SBD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SCR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SDG', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SEK', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SGD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SHP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SLE', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SLL', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('SOS', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('SRD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SSP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('STN', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SVC', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('SYP', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('SZL', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('THB', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('TJS', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('TMT', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('TND', 3, unixepoch() * 1000, unixepoch() * 1000),
  ('TOP', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('TRY', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('TTD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('TWD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('TZS', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('UAH', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('UGX', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('USD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('UYU', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('UZS', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('VES', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('VND', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('VUV', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('WST', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('XAF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('XCD', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('XCG', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('XDR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('XOF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('XPF', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('XSU', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('YER', 0, unixepoch() * 1000, unixepoch() * 1000),
  ('ZAR', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ZMW', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ZWG', 2, unixepoch() * 1000, unixepoch() * 1000),
  ('ZWL', 2, unixepoch() * 1000, unixepoch() * 1000);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "path_companies_enum_backup" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "path_company_id" text NOT NULL,
  "previous_compensation_type" text,
  "normalized_compensation_type" text NOT NULL,
  "previous_currency" text,
  "normalized_currency" text NOT NULL,
  "backed_up_at" integer NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint

INSERT INTO "path_companies_enum_backup" (
  "path_company_id",
  "previous_compensation_type",
  "normalized_compensation_type",
  "previous_currency",
  "normalized_currency",
  "backed_up_at"
)
SELECT
  pc.id,
  pc.compensation_type,
  CASE
    WHEN lower(trim(pc.compensation_type)) = 'hourly' THEN 'hourly'
    WHEN lower(trim(pc.compensation_type)) = 'monthly' THEN 'monthly'
    ELSE 'monthly'
  END AS normalized_compensation_type,
  pc.currency,
  CASE
    WHEN upper(trim(pc.currency)) IN (SELECT code FROM currency_catalog) THEN upper(trim(pc.currency))
    ELSE 'USD'
  END AS normalized_currency,
  unixepoch() * 1000
FROM "path_companies" AS pc
WHERE
  coalesce(pc.compensation_type, '') <> CASE
    WHEN lower(trim(pc.compensation_type)) = 'hourly' THEN 'hourly'
    WHEN lower(trim(pc.compensation_type)) = 'monthly' THEN 'monthly'
    ELSE 'monthly'
  END
  OR coalesce(pc.currency, '') <> CASE
    WHEN upper(trim(pc.currency)) IN (SELECT code FROM currency_catalog) THEN upper(trim(pc.currency))
    ELSE 'USD'
  END;
--> statement-breakpoint

UPDATE "path_companies"
SET
  "compensation_type" = CASE
    WHEN lower(trim("compensation_type")) = 'hourly' THEN 'hourly'
    WHEN lower(trim("compensation_type")) = 'monthly' THEN 'monthly'
    ELSE 'monthly'
  END,
  "currency" = CASE
    WHEN upper(trim("currency")) IN (SELECT code FROM currency_catalog) THEN upper(trim("currency"))
    ELSE 'USD'
  END;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_finance_settings_currency_backup" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "settings_id" text NOT NULL,
  "previous_currency" text,
  "normalized_currency" text NOT NULL,
  "backed_up_at" integer NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint

INSERT INTO "user_finance_settings_currency_backup" (
  "settings_id",
  "previous_currency",
  "normalized_currency",
  "backed_up_at"
)
SELECT
  ufs.id,
  ufs.currency,
  CASE
    WHEN upper(trim(ufs.currency)) IN (SELECT code FROM currency_catalog) THEN upper(trim(ufs.currency))
    ELSE 'USD'
  END,
  unixepoch() * 1000
FROM "user_finance_settings" AS ufs
WHERE coalesce(ufs.currency, '') <> CASE
  WHEN upper(trim(ufs.currency)) IN (SELECT code FROM currency_catalog) THEN upper(trim(ufs.currency))
  ELSE 'USD'
END;
--> statement-breakpoint

UPDATE "user_finance_settings"
SET "currency" = CASE
  WHEN upper(trim("currency")) IN (SELECT code FROM currency_catalog) THEN upper(trim("currency"))
  ELSE 'USD'
END;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "path_company_events_event_type_backup" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "event_id" text NOT NULL,
  "previous_event_type" text,
  "normalized_event_type" text NOT NULL,
  "backed_up_at" integer NOT NULL DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint

INSERT INTO "path_company_events_event_type_backup" (
  "event_id",
  "previous_event_type",
  "normalized_event_type",
  "backed_up_at"
)
SELECT
  pce.id,
  pce.event_type,
  CASE
    WHEN lower(trim(pce.event_type)) = 'start_rate' THEN 'start_rate'
    WHEN lower(trim(pce.event_type)) = 'rate_increase' THEN 'rate_increase'
    WHEN lower(trim(pce.event_type)) = 'annual_increase' THEN 'annual_increase'
    WHEN lower(trim(pce.event_type)) = 'mid_year_increase' THEN 'mid_year_increase'
    WHEN lower(trim(pce.event_type)) = 'promotion' THEN 'promotion'
    WHEN lower(trim(pce.event_type)) = 'end_of_employment' THEN 'end_of_employment'
    WHEN lower(trim(pce.event_type)) = 'annual' THEN 'annual_increase'
    ELSE 'rate_increase'
  END,
  unixepoch() * 1000
FROM "path_company_events" AS pce
WHERE coalesce(pce.event_type, '') <> CASE
  WHEN lower(trim(pce.event_type)) = 'start_rate' THEN 'start_rate'
  WHEN lower(trim(pce.event_type)) = 'rate_increase' THEN 'rate_increase'
  WHEN lower(trim(pce.event_type)) = 'annual_increase' THEN 'annual_increase'
  WHEN lower(trim(pce.event_type)) = 'mid_year_increase' THEN 'mid_year_increase'
  WHEN lower(trim(pce.event_type)) = 'promotion' THEN 'promotion'
  WHEN lower(trim(pce.event_type)) = 'end_of_employment' THEN 'end_of_employment'
  WHEN lower(trim(pce.event_type)) = 'annual' THEN 'annual_increase'
  ELSE 'rate_increase'
END;
--> statement-breakpoint

UPDATE "path_company_events"
SET "event_type" = CASE
  WHEN lower(trim("event_type")) = 'start_rate' THEN 'start_rate'
  WHEN lower(trim("event_type")) = 'rate_increase' THEN 'rate_increase'
  WHEN lower(trim("event_type")) = 'annual_increase' THEN 'annual_increase'
  WHEN lower(trim("event_type")) = 'mid_year_increase' THEN 'mid_year_increase'
  WHEN lower(trim("event_type")) = 'promotion' THEN 'promotion'
  WHEN lower(trim("event_type")) = 'end_of_employment' THEN 'end_of_employment'
  WHEN lower(trim("event_type")) = 'annual' THEN 'annual_increase'
  ELSE 'rate_increase'
END;
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
DROP TRIGGER IF EXISTS "path_company_events_event_type_insert_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "path_company_events_event_type_update_check";
--> statement-breakpoint

CREATE TRIGGER IF NOT EXISTS "path_companies_compensation_type_insert_check"
BEFORE INSERT ON "path_companies"
FOR EACH ROW
WHEN NEW.compensation_type IS NULL
  OR lower(trim(NEW.compensation_type)) NOT IN ('hourly', 'monthly')
BEGIN
  SELECT RAISE(ABORT, 'invalid compensation_type');
END;
--> statement-breakpoint

CREATE TRIGGER IF NOT EXISTS "path_companies_compensation_type_update_check"
BEFORE UPDATE OF "compensation_type" ON "path_companies"
FOR EACH ROW
WHEN NEW.compensation_type IS NULL
  OR lower(trim(NEW.compensation_type)) NOT IN ('hourly', 'monthly')
BEGIN
  SELECT RAISE(ABORT, 'invalid compensation_type');
END;
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

CREATE TRIGGER IF NOT EXISTS "path_company_events_event_type_insert_check"
BEFORE INSERT ON "path_company_events"
FOR EACH ROW
WHEN NEW.event_type IS NULL
  OR lower(trim(NEW.event_type)) NOT IN (
    'start_rate',
    'rate_increase',
    'annual_increase',
    'mid_year_increase',
    'promotion',
    'end_of_employment'
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid event_type');
END;
--> statement-breakpoint

CREATE TRIGGER IF NOT EXISTS "path_company_events_event_type_update_check"
BEFORE UPDATE OF "event_type" ON "path_company_events"
FOR EACH ROW
WHEN NEW.event_type IS NULL
  OR lower(trim(NEW.event_type)) NOT IN (
    'start_rate',
    'rate_increase',
    'annual_increase',
    'mid_year_increase',
    'promotion',
    'end_of_employment'
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid event_type');
END;
