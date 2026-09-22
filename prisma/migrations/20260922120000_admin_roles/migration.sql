-- Console permissions were hardcoded, so a new kind of admin needed a
-- developer. They are rows now, and JOC can define its own.
CREATE TABLE IF NOT EXISTS "AdminRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "builtIn" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminRole_name_key" ON "AdminRole"("name");
CREATE INDEX IF NOT EXISTS "AdminRole_sort_idx" ON "AdminRole"("sort");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminRoleId" TEXT;
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_adminRoleId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_adminRoleId_fkey"
  FOREIGN KEY ("adminRoleId") REFERENCES "AdminRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
