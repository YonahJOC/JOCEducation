-- Four permissions became fourteen, one per thing in the console, so an admin
-- type can be as narrow as "runs the shop". The stored rows hold the old four
-- keys; unexpanded they would grant nothing at all, because access.ts ignores
-- any key it does not recognise.
UPDATE "AdminRole" SET "capabilities" = (
  SELECT array_agg(DISTINCT x) FROM unnest(
    CASE WHEN 'content'  = ANY("capabilities") THEN ARRAY['lessons','resources','programs','board','rooms','shop','site'] ELSE ARRAY[]::text[] END ||
    CASE WHEN 'calendar' = ANY("capabilities") THEN ARRAY['programming','cycles'] ELSE ARRAY[]::text[] END ||
    CASE WHEN 'accounts' = ANY("capabilities") THEN ARRAY['schools','demos','orders','pricing'] ELSE ARRAY[]::text[] END ||
    CASE WHEN 'users'    = ANY("capabilities") THEN ARRAY['users'] ELSE ARRAY[]::text[] END
  ) AS x
)
WHERE "capabilities" && ARRAY['content','calendar','accounts']::text[];

-- Super admin holds everything, whatever it held before.
UPDATE "AdminRole"
SET "capabilities" = ARRAY[
  'lessons','resources','programs','board','rooms','shop','site',
  'programming','cycles','schools','demos','orders','pricing','users'
]
WHERE "isSuperAdmin" = true;
