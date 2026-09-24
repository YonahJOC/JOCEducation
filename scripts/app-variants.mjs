import { PrismaClient } from "@prisma/client";

/**
 * A second pass at matching portal schools to app organisations.
 *
 * The first pass asked the app whether an organisation existed under exactly
 * the name the portal holds, and nine of thirty-nine said yes. That is not
 * evidence the other thirty are absent — "YULA High School" here is very
 * likely "YULA Boys" there, and an exact-match lookup cannot see that.
 *
 * There is no endpoint that lists organisations (every shape of /organizations
 * is a 404), so the only way to ask is one name at a time. This tries a
 * handful of plausible spellings per school, slowly enough not to trip the
 * rate limit that stopped the first sweep.
 *
 * It writes nothing. It prints what it found, so a person can confirm the
 * matches before anything is recorded against a real school.
 */

const prisma = new PrismaClient();
const BASE = "https://api.justonechesed.org";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let calls = 0;
let blocked = false;

async function exists(name) {
  if (blocked) return null;
  calls++;
  try {
    const res = await fetch(
      `${BASE}/organisations/${encodeURIComponent(name)}/checkOrganizationExists`,
      { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) },
    );
    if (res.status === 429 || res.status >= 500) {
      blocked = true;
      console.log(`\n!! stopped: the app answered ${res.status} after ${calls} calls`);
      return null;
    }
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    blocked = true;
    console.log(`\n!! stopped: no answer after ${calls} calls`);
    return null;
  }
}

/** Plausible other spellings of one school's name. */
function variants(name) {
  const out = new Set();
  const add = (s) => {
    const t = s.replace(/\s+/g, " ").trim();
    if (t && t.toLowerCase() !== name.toLowerCase()) out.add(t);
  };

  const bare = name.replace(/^The\s+/i, "");
  add(bare);

  // Suffixes on and off. A school is "X", "X School", "X High School" and
  // "X Academy" in different people's records.
  const stem = bare
    .replace(/\s+(High School|Yeshiva High School|School|Academy)$/i, "")
    .trim();
  add(stem);
  for (const suffix of ["High School", "School", "Academy", "Yeshiva High School"]) {
    add(`${stem} ${suffix}`);
  }

  // Punctuation and spelling the two systems disagree about.
  add(bare.replace(/'/g, ""));
  add(bare.replace(/'/g, "'"));
  add(bare.replace(/-/g, " "));
  add(bare.replace(/\bYeshivat\b/i, "Yeshiva"));
  add(bare.replace(/\bYeshiva\b/i, "Yeshivat"));
  add(stem.replace(/'/g, ""));

  // A single-sex school is usually two organisations in the app.
  for (const half of ["Boys", "Girls"]) {
    add(`${stem} ${half}`);
  }

  return [...out];
}

const schools = await prisma.school.findMany({
  where: { appSchoolId: null },
  select: { id: true, name: true },
  orderBy: { name: "asc" },
});

console.log(`${schools.length} schools with no app organisation.\n`);

const found = [];
const none = [];

for (const s of schools) {
  if (blocked) break;

  let hit = null;
  for (const v of variants(s.name)) {
    const ok = await exists(v);
    if (ok === null) break;
    await sleep(700);
    if (ok) { hit = v; break; }
  }

  if (hit) {
    found.push({ school: s.name, appName: hit });
    console.log(`  MATCH  ${s.name}  ->  "${hit}"`);
  } else if (!blocked) {
    none.push(s.name);
    console.log(`  none   ${s.name}`);
  }
}

console.log(`\n${found.length} new matches, ${none.length} still unmatched, ${calls} calls made.`);
if (found.length > 0) {
  console.log("\nNothing was written. Confirm these, then record them.");
}

await prisma.$disconnect();
