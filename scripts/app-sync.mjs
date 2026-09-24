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
const TOKEN = process.env.JOC_APP_TOKEN ?? null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Which dashboard field means "logged and waiting for a teacher".
 *
 * /organisations/{id}/dashboard returns opportunitiesPendingVolunteers,
 * opportunitiesStaged and opportunitiesManual. A manually logged act is the
 * kind a teacher verifies — verificateManualOpportunity is the action — but
 * none of those three names says outright "logged and not yet verified", and
 * putting the wrong one on a console under "waiting on you" would send
 * somebody chasing a queue that does not exist.
 *
 * Set this once JOC confirms which it is. The figure then appears on the
 * console and the school's own panel with no other change.
 */
const PENDING_FIELD = null; // e.g. "opportunitiesStaged"

async function ask(path, withToken = false) {
  try {
    const headers = { accept: "application/json" };
    if (withToken && TOKEN) headers.authorization = `Bearer ${TOKEN}`;
    const res = await fetch(`${BASE}${path}`, {
      headers,
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

console.log(
  `${schools.length} schools linked. ` +
    (TOKEN
      ? "Token set — reading the full dashboard too."
      : "No JOC_APP_TOKEN — public figures only."),
);
console.log();

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
    // Everything else on this table keeps its default of nought, and this
    // flag is what stops a screen reading those noughts as measurements.
    publicOnly: true,
    actsAllTime: acts,
    hoursAllTime: time,
    lastActivityText: last,
    syncedAt: new Date(),
  };

  // Everything the console actually wants lives behind the login.
  if (TOKEN) {
    const full = await ask(`/organisations/${s.appSchoolId}/dashboard`, true);
    await sleep(250);

    if (full) {
      data.publicOnly = false;
      data.minutesThisYear = Math.round((Number(full.hoursInSchoolYear ?? 0) || 0) * 60);
      data.opportunitiesThisCycle = Number(full.countOpportunitiesInSchoolYear ?? 0) || 0;
      data.opportunitiesOpen = Number(full.opportunitiesUpcoming ?? 0) || 0;
      data.activeStudents = Number(full.volunteersTotal ?? 0) || 0;

      if (PENDING_FIELD && full[PENDING_FIELD] != null) {
        data.unapprovedEntries = Number(full[PENDING_FIELD]) || 0;
      }
    }
  }

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

if (!TOKEN) {
  console.log(
    "\nHow many acts are waiting on a teacher cannot be read without a token:\n" +
      "/opportunities/{id}/counts and /organisations/{id}/dashboard both answer\n" +
      "401. Nothing shows a made-up figure in the meantime.",
  );
}

if (quiet.length > 0) {
  console.log(`\nLinked, but nothing logged yet (${quiet.length}):`);
  quiet.forEach((n) => console.log(`  ${n}`));
}
if (failed.length > 0) {
  console.log(`\nThe app did not answer for (${failed.length}):`);
  failed.forEach((n) => console.log(`  ${n}`));
}

await prisma.$disconnect();
