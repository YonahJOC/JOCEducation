/**
 * The JOC test school.
 *
 *   node scripts/test-school.mjs             build or rebuild it
 *   node scripts/test-school.mjs --remove    take it away again
 *
 * One school signed up to every program, booked in for every program, with a
 * coordinator, a subscription, a teacher who runs its app console, and the
 * three status-board milestones ticked. It exists so the whole chain can be
 * walked end to end — console to school to sign-up to spreadsheet — without
 * touching a real school's record.
 *
 * Everything it creates is named "JOC Test School" or sits under the
 * joc-test-school slug, so nothing here can be mistaken for a real school and
 * --remove can find all of it.
 */
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
for (const l of fs.readFileSync(".env","utf8").split(/\r?\n/)) { const m=/^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if(m) process.env[m[1]]=m[2].replace(/^["']|["']$/g,""); }
const p = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
const SLUG = "joc-test-school";
const REMOVE = process.argv.includes("--remove");
const day = (n) => new Date(Date.now() + n * 86400000);

// Idempotent: run it again and it rebuilds rather than duplicating.
const old = await p.school.findUnique({ where: { slug: SLUG }, select: { id: true } });
if (old) {
  await p.formResponse.deleteMany({ where: { schoolId: old.id } });
  await p.programEvent.deleteMany({ where: { schoolId: old.id } });
  await p.user.deleteMany({ where: { schoolId: old.id } });
  await p.school.delete({ where: { id: old.id } });
  console.log("removed the previous one");
}

if (REMOVE) {
  console.log(old ? "JOC Test School and everything attached to it is gone." : "There was nothing to remove.");
  await p.$disconnect();
  process.exit(0);
}

const school = await p.school.create({
  data: {
    name: "JOC Test School",
    slug: SLUG,
    city: "Brooklyn",
    region: "Brooklyn",
    country: "United States",
    type: "DAY_SCHOOL",
    enrollment: "MEDIUM",
    studentCount: 280,
    status: "ACTIVE",
    // Matched to the app, so the App panel has something to line up with.
    appSchoolId: "joc-test-school",
    // The three milestones the status board asks about.
    studentListAt: day(-21),
    liveScreenAt: day(-14),
    storeOpenAt: day(-7),
    subscription: {
      create: { plan: "FULL_PARTNERSHIP", status: "ACTIVE", interval: "ANNUAL", seats: 25, currentPeriodEnd: day(300) },
    },
    contacts: {
      create: {
        name: "Test Coordinator", title: "Chesed coordinator",
        email: "coordinator@joctestschool.test", phone: "718-555-0100", isPrimary: true,
      },
    },
    activities: {
      create: [
        { type: "CALL", summary: "Set-up call — walked through all the programs", occurredAt: day(-10) },
        { type: "VISIT", summary: "Ran the Kindness Booth training with 7th grade", occurredAt: day(-4) },
      ],
    },
  },
  select: { id: true, name: true },
});

// A teacher there who runs the school's own app console.
const teacher = await p.user.create({
  data: {
    email: "teacher@joctestschool.test",
    name: "Test Teacher",
    role: "TEACHER",
    schoolId: school.id,
    schoolAppAdmin: true,
  },
  select: { id: true },
});

// Signed up to every program, and booked in for each one.
const programs = await p.programPage.findMany({
  orderBy: { sort: "asc" },
  select: { id: true, name: true, slug: true, formId: true, form: { select: { fields: { orderBy: { order: "asc" }, select: { id: true, label: true } } } } },
});

let signUps = 0, dates = 0;
for (const [i, prog] of programs.entries()) {
  if (prog.formId && prog.form) {
    const answers = prog.form.fields.map((f) => ({
      fieldId: f.id,
      label: f.label,
      value:
        /school name/i.test(f.label) ? "JOC Test School"
        : /role/i.test(f.label) ? "Chesed coordinator"
        : /grades/i.test(f.label) ? "5 through 8"
        : /how many/i.test(f.label) ? "120"
        : /phone/i.test(f.label) ? "718-555-0100"
        : /when/i.test(f.label) ? day(30).toISOString().slice(0, 10)
        : "This is the JOC test school — everything here is for checking the system.",
    }));
    await p.formResponse.create({
      data: {
        formId: prog.formId,
        schoolId: school.id,
        userId: teacher.id,
        name: "Test Coordinator",
        email: "coordinator@joctestschool.test",
        answers,
        createdAt: day(-20 + i),
      },
    });
    signUps++;
  }

  await p.programEvent.create({
    data: {
      slug: `joc-test-${prog.slug}`,
      title: `${prog.name} at JOC Test School`,
      kind: "SCHOOL_PROGRAM",
      programId: prog.id,
      schoolId: school.id,
      startsAt: day(7 + i * 7),
      audience: "Grades 5–8",
      status: "CONFIRMED",
      published: true,
      detail: "Booked for the test school so the whole chain can be walked end to end.",
    },
  });
  dates++;
}

console.log(`\n${school.name}`);
console.log(`  ${signUps} sign-ups, one per program with a form`);
console.log(`  ${dates} dates booked, one per program`);
console.log(`  1 teacher who runs the school's app console`);
console.log(`  subscription, coordinator, a call and a visit logged`);
console.log(`  matched to the app as "joc-test-school"`);
console.log(`\n  console:  /admin/schools/${school.id}`);
console.log(`  status:   /admin/schools/status`);
await p.$disconnect();
