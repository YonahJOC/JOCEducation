-- What the app's public dashboard actually offers per school.
--
-- Two all-time figures. The time one keeps "Raw" in its name on purpose: the
-- app calls it spendTimeByOrganization and does not say whether that is
-- minutes or hours, so nothing renders it until JOC confirms which.

ALTER TABLE "AppSchoolStats"
  ADD COLUMN IF NOT EXISTS "actsAllTime"    INTEGER,
  ADD COLUMN IF NOT EXISTS "timeAllTimeRaw" INTEGER;
