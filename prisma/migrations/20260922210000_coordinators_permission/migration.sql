-- Naming who runs a program is the programming team's job, not the education
-- team's. It shared the Programs permission, which meant the people actually
-- running the programs could not name their own coordinators.
UPDATE "AdminRole"
SET "capabilities" = array_append("capabilities", 'coordinators')
WHERE 'programming' = ANY("capabilities")
  AND NOT ('coordinators' = ANY("capabilities"));

UPDATE "AdminRole"
SET "capabilities" = array_append("capabilities", 'coordinators')
WHERE "isSuperAdmin" = true AND NOT ('coordinators' = ANY("capabilities"));
