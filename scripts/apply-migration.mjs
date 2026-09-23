import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const dir = process.argv[2];
const sql = fs.readFileSync(`prisma/migrations/${dir}/migration.sql`, "utf8");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

// Split on semicolons that end a line, keeping DO $$ ... $$ blocks whole.
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.split("\n").every((l) => l.trim().startsWith("--")));

for (const s of statements) {
  try {
    await prisma.$executeRawUnsafe(s);
    console.log("ok  ", s.split("\n")[0].slice(0, 80));
  } catch (e) {
    console.log("FAIL", s.split("\n")[0].slice(0, 80), "—", e.message.split("\n")[0]);
    process.exitCode = 1;
  }
}

// Record it, so `prisma migrate` never tries to replay it.
await prisma.$executeRawUnsafe(`
  INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
  VALUES (gen_random_uuid()::text, '', now(), $1, NULL, NULL, now(), 1)
  ON CONFLICT DO NOTHING
`, dir);
console.log("recorded", dir);
await prisma.$disconnect();
