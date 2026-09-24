/**
 * Every organisation in the JOC App, by walking the id space.
 *
 * Three things were tried before this. Asking one name at a time matched nine
 * of thirty-nine and could not see that "YULA High School" here is "YULA
 * Boys" there. `/organisations/getAllByGuest` returns twenty-five
 * organisations and not one of them is a school — it is a public directory,
 * not the list. Every search endpoint wants a token.
 *
 * `/organisations/{id}/getPublicInfo` answers for any id without one, so the
 * list can be had by asking for each id in turn. Ids seen so far run to 209,
 * so it walks to 260 and stops.
 *
 * It writes nothing. It prints the list to a file for the matcher to read,
 * because the sweep is slow and should happen once.
 */

import fs from "node:fs";

const BASE = "https://api.justonechesed.org";
const MAX_ID = Number(process.argv[2] ?? 260);
const OUT = "app-orgs.json";

/** At a time. Gentle enough that the rate limit never came near. */
const BATCH = 6;
const PAUSE = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function one(id) {
  try {
    const res = await fetch(`${BASE}/organisations/${id}/getPublicInfo`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429) return { id, rateLimited: true };
    if (!res.ok) return null;
    const d = await res.json();
    if (!d?.organizationName) return null;
    return {
      id: String(d.id ?? id),
      name: d.organizationName,
      type: d.organisationGeneralType ?? null,
      hourGoal: d.hourYearlyGoal ?? null,
      actGoal: d.actYearlyGoal ?? null,
    };
  } catch {
    return null;
  }
}

const found = [];
let rateLimited = false;

for (let start = 1; start <= MAX_ID; start += BATCH) {
  const ids = [];
  for (let i = start; i < start + BATCH && i <= MAX_ID; i++) ids.push(i);

  const results = await Promise.all(ids.map(one));
  for (const r of results) {
    if (!r) continue;
    if (r.rateLimited) { rateLimited = true; continue; }
    found.push(r);
  }

  if (rateLimited) {
    console.log(`\n!! rate limited at id ${start}. Stopping with ${found.length} found.`);
    break;
  }

  process.stdout.write(`\r${start + BATCH - 1}/${MAX_ID} · ${found.length} found`);
  await sleep(PAUSE);
}

console.log(`\n\n${found.length} organisations.`);
fs.writeFileSync(OUT, JSON.stringify(found, null, 2));
console.log(`Written to ${OUT}.`);
