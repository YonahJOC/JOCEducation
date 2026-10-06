import { PrismaClient } from "@prisma/client";

/**
 * Record that the schools on the JOC App are, in fact, on the JOC App.
 *
 * Thirty schools are linked to an app organisation and have real figures
 * against them — Brauser 3,566 acts, Bruriah 2,323, Ma'ayanot 5,766 — and
 * not one had a ProgramEnrollment saying they run it. So the console could
 * see them and their own portal could not: a school opening /school was told
 * it was "not down as running any JOC program yet" while the app it uses
 * every day said otherwise.
 *
 * The evidence for the enrolment is the acts themselves. A school whose
 * students have logged three thousand acts is running the program, whatever
 * the portal had on file.
 *
 * Two deliberate limits:
 *
 *   **Only schools with acts.** A linked school with nothing logged is not
 *   evidence of anything, so it is left alone and listed at the end.
 *
 *   **Never overwrite.** A school that already has an enrolment keeps the
 *   stage somebody chose for it, whatever this script would have guessed.
 *
 * Pass --undo to remove only the rows this created, which are the ones whose
 * note still says so.
 */

const prisma = new PrismaClient();
const UNDO = process.argv.includes("--undo");
const NOTE = "Recorded from the app's own figures.";

const app = await prisma.programPage.findUnique({
  where: { slug: "joc-app" },
  select: { id: true, name: true },
});
if (!app) {
  console.log("There is no joc-app program to enrol anybody in.");
  process.exit(1);
}

if (UNDO) {
  const { count } = await prisma.programEnrollment.deleteMany({
    where: { programId: app.id, note: NOTE },
  });
  console.log(`Removed ${count} enrolments this script had created.`);
  await prisma.$disconnect();
  process.exit(0);
}

const schools = await prisma.school.findMany({
  where: { appSchoolId: { not: null } },
  select: {
    id: true, name: true,
    appStats: { select: { actsAllTime: true, syncedAt: true } },
    enrollments: { where: { programId: app.id }, select: { id: true, stage: true } },
  },
  orderBy: { name: "asc" },
});

let made = 0;
const already = [];
const quiet = [];

for (const s of schools) {
  const acts = s.appStats?.actsAllTime ?? 0;

  if (s.enrollments.length > 0) {
    already.push(`${s.name} (${s.enrollments[0].stage})`);
    continue;
  }
  if (acts <= 0) {
    quiet.push(s.name);
    continue;
  }

  await prisma.programEnrollment.create({
    data: {
      schoolId: s.id,
      programId: app.id,
      // Running, because their students are logging acts right now. Anything
      // earlier would be a stage the evidence contradicts.
      stage: "RUNNING",
      stageSince: s.appStats?.syncedAt ?? new Date(),
      startedAt: s.appStats?.syncedAt ?? new Date(),
      note: NOTE,
    },
  });
  console.log(`  ${String(acts).padStart(5)} acts   ${s.name}`);
  made++;
}

console.log(`\n${made} schools enrolled in ${app.name}.`);
if (already.length > 0) {
  console.log(`\nAlready had one, left alone (${already.length}):`);
  already.forEach((n) => console.log(`  ${n}`));
}
if (quiet.length > 0) {
  console.log(`\nLinked but nothing logged, so no evidence to act on (${quiet.length}):`);
  quiet.forEach((n) => console.log(`  ${n}`));
}

await prisma.$disconnect();
