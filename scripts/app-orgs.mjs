import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

/**
 * Match every portal school to its organisation in the JOC App.
 *
 * The first pass asked the app, one school at a time, whether an organisation
 * existed under exactly the name the portal holds. Nine of thirty-nine said
 * yes, which was never evidence the other thirty were absent — "YULA High
 * School" here is "YULA Boys" there, and an exact-match lookup cannot see
 * that.
 *
 * getAllByGuest looked like the answer and is not: it returns twenty-five
 * organisations and not one of them is a school. What does work is
 * /organisations/{id}/getPublicInfo, which answers for any id without a
 * token — so scripts/app-org-sweep.mjs walks the id space into app-orgs.json
 * and this matches against that. 161 organisations, not 25.
 *
 * It writes nothing by default. Pass --write to record the confirmed ids.
 */

const prisma = new PrismaClient();
const BASE = "https://api.justonechesed.org";
const WRITE = process.argv.includes("--write");

/** Down to the letters that matter, so punctuation and case stop mattering. */
function key(s) {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|of|for)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The same, with the words that say "this is a school" taken off. */
function stem(s) {
  return key(s)
    .replace(/\b(high school|middle school|school|academy|yeshiva high|yeshivah high|yeshiva|yeshivat|yeshivah)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const orgs = JSON.parse(fs.readFileSync("app-orgs.json", "utf8")).map((o) => ({
  id: o.id,
  organizationName: o.name,
}));
console.log(`${orgs.length} organisations in the app.\n`);

const byKey = new Map();
const byStem = new Map();
for (const o of orgs) {
  const name = o.organizationName ?? "";
  if (!name) continue;
  byKey.set(key(name), o);
  const st = stem(name);
  if (st) {
    if (!byStem.has(st)) byStem.set(st, []);
    byStem.get(st).push(o);
  }
}

const schools = await prisma.school.findMany({
  select: { id: true, name: true, appSchoolId: true },
  orderBy: { name: "asc" },
});

const exact = [];
const likely = [];
const guesses = [];
const none = [];

for (const s of schools) {
  // Test schools are ours and have no organisation in the app.
  if (s.appSchoolId && !/^\d+$/.test(s.appSchoolId)) continue;

  const k = key(s.name);
  const st = stem(s.name);

  const hit = byKey.get(k);
  if (hit) {
    exact.push({ s, org: hit, how: "name matches" });
    continue;
  }

  const stemHits = byStem.get(st) ?? [];
  if (stemHits.length === 1) {
    likely.push({ s, org: stemHits[0], how: "same name, different suffix" });
    continue;
  }
  if (stemHits.length > 1) {
    guesses.push({ s, orgs: stemHits, how: `${stemHits.length} organisations share that name` });
    continue;
  }

  // One name contained in the other — "SKA" inside "SKA Girls High School".
  const contains = orgs.filter((o) => {
    const ok = stem(o.organizationName ?? "");
    if (!ok || !st) return false;
    return ok.includes(st) || st.includes(ok);
  });
  if (contains.length === 1) {
    likely.push({ s, org: contains[0], how: "one name contains the other" });
  } else if (contains.length > 1) {
    guesses.push({ s, orgs: contains, how: `${contains.length} organisations could be it` });
  } else {
    none.push(s);
  }
}

const show = (r) =>
  `  ${String(r.org.id).padStart(4)}  ${r.s.name}` +
  (key(r.s.name) === key(r.org.organizationName) ? "" : `  ->  "${r.org.organizationName}"`) +
  `   (${r.how})`;

console.log(`CERTAIN — the name is the same (${exact.length})`);
exact.forEach((r) => console.log(show(r)));

console.log(`\nLIKELY — please confirm (${likely.length})`);
likely.forEach((r) => console.log(show(r)));

console.log(`\nAMBIGUOUS — pick one (${guesses.length})`);
guesses.forEach((r) => {
  console.log(`  ${r.s.name}   (${r.how})`);
  r.orgs.forEach((o) => console.log(`        ${String(o.id).padStart(4)}  ${o.organizationName}`));
});

console.log(`\nNOT IN THE APP (${none.length})`);
none.forEach((s) => console.log(`  ${s.name}`));

// What is in the app that the portal has never heard of. Worth knowing:
// these are schools running the app with no record on this side.
const claimed = new Set([...exact, ...likely].map((r) => String(r.org.id)));
const unknown = orgs.filter((o) => !claimed.has(String(o.id)));
console.log(`\nIN THE APP, NOT IN THE PORTAL (${unknown.length})`);
unknown.forEach((o) => console.log(`  ${String(o.id).padStart(4)}  ${o.organizationName}`));

if (WRITE) {
  // Only the certain ones. A likely match is a person's call, not a script's.
  for (const r of exact) {
    await prisma.school.update({
      where: { id: r.s.id },
      data: { appSchoolId: String(r.org.id) },
    });
  }
  console.log(`\nRecorded ${exact.length} certain matches. Nothing else was written.`);
} else {
  console.log("\nNothing was written. Pass --write to record the certain matches.");
}

await prisma.$disconnect();
