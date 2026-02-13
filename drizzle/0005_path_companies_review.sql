ALTER TABLE "path_companies"
ADD COLUMN "review" text NOT NULL DEFAULT '' CHECK (length("review") <= 1000);
