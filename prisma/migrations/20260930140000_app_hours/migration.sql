-- The app's time figure is hours.
--
-- It was stored as timeAllTimeRaw because the API does not name its unit and
-- a figure shown in the wrong one is worse than none. The schools settle it:
-- Hebrew Academy Montreal reports 3 against 9 acts, which as minutes is
-- twenty seconds an act and as hours is twenty minutes an act.

ALTER TABLE "AppSchoolStats" RENAME COLUMN "timeAllTimeRaw" TO "hoursAllTime";
