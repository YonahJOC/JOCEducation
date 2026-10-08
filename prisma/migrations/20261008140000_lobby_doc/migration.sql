-- Everything the lobby screen shows, as one JSON document.
--
-- One row, id 'singleton'. It is small, it is edited by a handful of people
-- and it is read as a whole every time, so splitting it into tables would buy
-- nothing and cost the optimistic version check that stops two people
-- overwriting each other.
CREATE TABLE "LobbyDoc" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    CONSTRAINT "LobbyDoc_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LobbyDoc" ADD CONSTRAINT "LobbyDoc_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
