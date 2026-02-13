ALTER TABLE "path_companies"
ADD COLUMN "score" integer NOT NULL DEFAULT 5 CHECK ("score" BETWEEN 1 AND 10);
