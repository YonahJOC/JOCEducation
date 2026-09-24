-- Mark rows that came from the app's public endpoints only.
--
-- Those carry acts all-time and the last activity. Everything else on this
-- table keeps its default of nought, and a nought meaning "never asked" looks
-- exactly like one meaning "nothing happened".

ALTER TABLE "AppSchoolStats"
  ADD COLUMN IF NOT EXISTS "publicOnly" BOOLEAN NOT NULL DEFAULT false;
