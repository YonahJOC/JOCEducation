/**
 * Which of our schools the JOC App already knows, and by what id.
 *
 * `School.appSchoolId` is the only thing the two systems are matched on, and
 * it is set by hand. Three schools have one today and all three are
 * placeholders. This asks the App about every school we hold, by name, and
 * prints what it finds.
 *
 *   node scripts/app-match.mjs           # report only
 *   node scripts/app-match.mjs --write   # also set appSchoolId where it matched
 *
 * It reads two public endpoints and needs no token. It writes nothing to the
 * App and sends nothing to anybody.
 *
 * One thing it deliberately drops: the public dashboard carries
 * `recentlyVolunteerName`, `recentlyVolunteerGrade` and an avatar — a named
 * child. Nothing here reads those fields, and nothing should.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = "https://api.justonechesed.org";
const WRITE = process.argv.includes("--write");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(path) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** The App's public dashboard for one organisation, by its name. */
async function lookup(name) {
  const exists = await ask(`/organisations/${encodeURIComponent(name)}/checkOrganizationExists`);
  if (exists !== true) return { found: false };

  const d = await ask(`/organisations/${encodeURIComponent(name)}/publicDashboardByName`);
  if (!d?.organizationId) return { found: true, appId: null };

  // Figures only. The three `recentlyVolunteer*` fields on this response are
  // a child's name, grade and photograph, and are not read here.
  return {
    found: true,
    appId: String(d.organizationId),
    opportunities: d.opportunitiesCount ?? null,
    spendTime: d.spendTimeByOrganization ?? null,
    lastOpportunity: d.recentlyOppoName ?? null,
  };
}

const schools = await prisma.school.findMany({
  select: { id: true, name: true, appSchoolId: true },
  orderBy: { name: "asc" },
});

console.log(`${schools.length} schools in the portal. Asking the App about each.\n`);

const matched = [];
const missing = [];

for (const s of schools) {
  const r = await lookup(s.name);
  await sleep(120);

  if (!r.found || !r.appId) {
    missing.push(s.name);
    console.log(`  ·  ${s.name.padEnd(36)} not on the App`);
    continue;
  }

  matched.push({ schoolId: s.id, name: s.name, ...r });
  const was = s.appSchoolId ? ` (was ${s.appSchoolId})` : "";
  console.log(
    `  ✓  ${s.name.padEnd(36)} org ${String(r.appId).padEnd(5)} ` +
    `${String(r.opportunities ?? "—").padStart(5)} acts  ${String(r.spendTime ?? "—").padStart(7)} time${was}`,
  );
}

console.log(`\n${matched.length} matched, ${missing.length} not on the App.`);

if (WRITE) {
  for (const m of matched) {
    await prisma.school.update({
      where: { id: m.schoolId },
      data: { appSchoolId: m.appId },
    });
  }
  console.log(`Wrote ${matched.length} app ids.`);
} else if (matched.length > 0) {
  console.log("Run again with --write to set appSchoolId on the matched ones.");
}

await prisma.$disconnect();
