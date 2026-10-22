/**
 * Sets the word typed on the counter iPad.
 *
 *   node --env-file=.env scripts/set-counter-password.mjs JOCJOC
 *
 * It lives in the lobby document rather than in this repository, which is
 * public, and rather than in an environment variable, which would need a
 * deploy to change. Changing it here logs every iPad out at once, because
 * the cookie each one holds is derived from the word itself.
 *
 * Written the way the panel writes: read, change one field, bump the
 * version, and only save if nobody else saved first.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DOC_ID = "singleton";

const word = (process.argv[2] ?? "").trim();
if (!word) {
  console.error("Give the password as an argument.");
  process.exit(1);
}
if (word.length < 4) {
  console.error("Too short to be worth having.");
  process.exit(1);
}

const row = await prisma.lobbyDoc.findUnique({ where: { id: DOC_ID } });
if (!row) throw new Error("No lobby document.");

const doc = row.data;
const had = Boolean((doc.settings.counterPass ?? "").trim());
doc.settings.counterPass = word;
doc.version = row.version + 1;
doc.updatedAt = new Date().toISOString();

const done = await prisma.lobbyDoc.updateMany({
  where: { id: DOC_ID, version: row.version },
  data: { version: doc.version, data: doc, updatedAt: new Date() },
});
if (done.count !== 1) throw new Error("Somebody saved the panel at the same moment. Nothing changed; run again.");

console.log(`\n  Counter password ${had ? "changed" : "set"}.`);
console.log(`  Every iPad already signed in will be asked again.\n`);

await prisma.$disconnect();
