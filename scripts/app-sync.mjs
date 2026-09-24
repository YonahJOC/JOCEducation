import { PrismaClient } from "@prisma/client";

/**
 * Read what the app will tell us about each linked school.
 *
 * Only two endpoints answer without a token, so only what they carry is
 * written here:
 *
 *   `/organisations/{id}/getPublicInfo` — the name and what kind of
 *   organisation it is.
 *   `/organisations/{id}/publicDashboard` — acts logged all-time, time logged
 *   all-time, and what the most recent one was.
 *
 * Everything the console would rather have — hours waiting on a teacher,
 * active students this month, opportunities open right now, the prize store —
 * is behind a token. Those fields stay null and the panel says so in words,
 * which is the point: a nought would read as "nobody did anything".
 *
 * Three things this will not record:
 *
 *   **A student.** The dashboard hands back recentlyVolunteerName, Grade and
 *   Avatar with every call. They are a child's name, year group and
 *   photograph. They are not read.
 *
 *   **A unit it cannot vouch for.** spendTimeByOrganization is a number with
 *   no unit in its name, so it is stored raw and nothing renders it.
 *
 *   **Anything for a school with no organisation id.** An unlinked school
 *   gets no row rather than an empty one.
 */

const prisma = new PrismaClient();
const BASE = "https://api.justonechesed.org";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const schools = await prisma.school.findMany({
  where: { appSchoolId: { not: null } },
  select: { id: true, name: true, appSchoolId: true },
  orderBy: { name: "asc" },
});

console.log(`${schools.length} schools linked to an app organisation.\n`);

let written = 0;
const quiet = [];
const failed = [];

for (const s of schools) {
  // Our own test schools have a slug, not a numeric organisation id.
  if (!/^\d+$/.test(s.appSchoolId)) continue;

  const dash = await ask(`/organisations/${s.appSchoolId}/publicDashboard`);
  await sleep(250);

  if (!dash) {
    failed.push(s.name);
    continue;
  }

  const acts = Number(dash.opportunitiesCount ?? 0) || 0;
  const time = Number(dash.spendTimeByOrganization ?? 0) || 0;

  // What the last act was. Never who did it — the three recentlyVolunteer*
  // fields on this response are a child and are not read.
  const last = typeof dash.recentlyOppoName === "string" ? dash.recentlyOppoName : null;

  const data = {
    actsAllTime: acts,
    timeAllTimeRaw: time,
    lastActivityText: last,
    syncedAt: new Date(),
  };

  await prisma.appSchoolStats.upsert({
    where: { schoolId: s.id },
    create: { schoolId: s.id, ...data },
    update: data,
  });

  if (acts === 0) quiet.push(s.name);
  else console.log(`  ${String(acts).padStart(6)} acts   ${s.name}${last ? `   — last: ${last}` : ""}`);
  written++;
}

console.log(`\n${written} schools read.`);

if (quiet.length > 0) {
  console.log(`\nLinked, but nothing logged yet (${quiet.length}):`);
  quiet.forEach((n) => console.log(`  ${n}`));
}
if (failed.length > 0) {
  console.log(`\nThe app did not answer for (${failed.length}):`);
  failed.forEach((n) => console.log(`  ${n}`));
}

await prisma.$disconnect();
