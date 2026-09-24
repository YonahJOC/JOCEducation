/**
 * Three test schools, filled in, so every panel in the portal has something
 * in it to look at.
 *
 * Almost every screen JOC has built is still showing its empty state, because
 * the one test school carries eight enrolments and nothing else — no app
 * figures, no invitations, no write-ups, no messages. You cannot judge a
 * design you have only ever seen say "nothing yet".
 *
 * So:
 *
 *   JOC Test School    every field and every report the portal knows about
 *   JOC Test School B  on the app with figures, amber on the Kindness Booth
 *   JOC Test School C  on the app and never reported, red on the Kindness Booth
 *
 * B and C are deliberately NOT in the Kindness Booth, because the traffic
 * light is the list of schools that are not in it — a school that is in the
 * program never appears there. Their lights are set by hand so all three
 * chips have something behind them; toggle them from the console.
 *
 *   node scripts/test-schools.mjs
 *
 * Re-runnable: it replaces what it wrote last time rather than adding to it.
 * It sends nothing to anybody — every row here is a record of something, in
 * the same way the rest of the portal records rather than notifies.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 86_400_000;
const ago = (d) => new Date(Date.now() - d * DAY);
const ahead = (d) => new Date(Date.now() + d * DAY);

/** Everything this script writes is tagged, so it can clean up after itself. */
const TEST_SLUGS = ["joc-test-school", "joc-test-school-b", "joc-test-school-c"];

const staff = await prisma.user.findFirst({
  where: { email: { endsWith: "@justonechesed.org" } },
  select: { id: true, name: true, email: true },
});

const kindnessBooth = await prisma.programPage.findUnique({
  where: { slug: "kindness-booth" },
  select: { id: true },
});
const jocApp = await prisma.programPage.findUnique({
  where: { slug: "joc-app" },
  select: { id: true },
});

if (!kindnessBooth || !jocApp) {
  console.error("The Kindness Booth or the JOC App is missing. Nothing written.");
  process.exit(1);
}

// ─── The school that has everything ─────────────────────────────────────────

const main = await prisma.school.findUnique({
  where: { slug: "joc-test-school" },
  select: { id: true },
});

if (!main) {
  console.error('No school with slug "joc-test-school". Nothing written.');
  process.exit(1);
}

await prisma.school.update({
  where: { id: main.id },
  data: {
    website: "https://example.edu",
    emailDomains: ["joctest.edu"],
    studentCount: 280,
    // The figure the school panel shows a teacher, with the moment it was
    // read — a number with no date is a number nobody can trust.
    unapprovedHours: 28,
    unapprovedCheckedAt: ago(1),
    accountManagerId: staff?.id ?? null,
  },
});

// What the app reports about this school: the whole of the coordinator's
// dashboard comes from here.
await prisma.appSchoolStats.upsert({
  where: { schoolId: main.id },
  create: {
    schoolId: main.id,
    minutesThisWeek: 1_240,
    minutesThisCycle: 5_880,
    minutesThisYear: 21_400,
    unapprovedMinutes: 1_710,
    unapprovedEntries: 19,
    unapprovedStudents: 11,
    unapprovedOldestAt: ago(16),
    unapprovedThisWeek: 6,
    unapprovedOneToTwo: 5,
    unapprovedOverTwo: 8,
    activeStudents: 96,
    activeStudentsLast: 81,
    opportunitiesOpen: 7,
    opportunitiesThisWeek: 3,
    opportunitiesThisCycle: 12,
    lastActivityAt: ago(0),
    lastActivityText: "A student logged 40 minutes helping at a food packing.",
    storeRedeemedThisMonth: 23,
    storeTopPrize: "Pizza for the class",
    syncedAt: new Date(),
  },
  update: { syncedAt: new Date(), unapprovedMinutes: 1_710, unapprovedOldestAt: ago(16) },
});

await prisma.appChallengeStat.deleteMany({ where: { schoolId: main.id } });
await prisma.appChallengeStat.createMany({
  data: [
    { schoolId: main.id, appChallengeId: "t-1", title: "Thank a teacher", joined: 64, finished: 41, running: true, syncedAt: new Date() },
    { schoolId: main.id, appChallengeId: "t-2", title: "Call a grandparent", joined: 38, finished: 12, running: true, syncedAt: new Date() },
    { schoolId: main.id, appChallengeId: "t-3", title: "Shabbos table set-up", joined: 51, finished: 50, running: false, syncedAt: new Date() },
  ],
});

await prisma.appSchoolMessage.deleteMany({ where: { schoolId: main.id } });
await prisma.appSchoolMessage.createMany({
  data: [
    {
      schoolId: main.id, appMessageId: "m-1", fromName: "Mrs. Fried",
      body: "Two of our girls can't see last week's hours in the app. Can somebody take a look?",
      sentAt: ago(2), answered: false, syncedAt: new Date(),
    },
    {
      schoolId: main.id, appMessageId: "m-2", fromName: "Rabbi Stein",
      body: "The live screen in the lobby froze on Sunday. It came back by itself.",
      sentAt: ago(9), answered: true, syncedAt: new Date(),
    },
  ],
});

// Who to ring. The first is the one every panel falls back to.
await prisma.schoolContact.deleteMany({ where: { schoolId: main.id } });
await prisma.schoolContact.createMany({
  data: [
    { schoolId: main.id, name: "Mrs. R. Fried", title: "Chesed coordinator", email: "chesed@joctest.edu", phone: "(718) 555-0142", isPrimary: true },
    { schoolId: main.id, name: "Rabbi Y. Stein", title: "Principal", email: "principal@joctest.edu", phone: "(718) 555-0101" },
    { schoolId: main.id, name: "Mrs. L. Adler", title: "Office", email: "office@joctest.edu", phone: "(718) 555-0100" },
  ],
});

// Teachers invited who never signed in — the row the school's Today page
// shows its admin, and one of the few things that quietly goes wrong.
await prisma.invitation.deleteMany({ where: { schoolId: main.id } });
await prisma.invitation.createMany({
  data: [
    { email: "m.adler@joctest.edu", schoolId: main.id, role: "TEACHER", token: "test-inv-1", status: "PENDING", expiresAt: ahead(20), invitedById: staff?.id ?? null },
    { email: "s.weiss@joctest.edu", schoolId: main.id, role: "TEACHER", token: "test-inv-2", status: "PENDING", expiresAt: ahead(20), invitedById: staff?.id ?? null },
    { email: "d.katz@joctest.edu", schoolId: main.id, role: "TEACHER", token: "test-inv-3", status: "ACCEPTED", expiresAt: ahead(20), acceptedAt: ago(30), invitedById: staff?.id ?? null },
  ],
});

// The account history, in the four kinds the log knows.
await prisma.schoolActivity.deleteMany({ where: { schoolId: main.id, summary: { startsWith: "[test]" } } });
await prisma.schoolActivity.createMany({
  data: [
    { schoolId: main.id, type: "CALL", summary: "[test] Called about the Kindness Booth dates", detail: "They want the week before Chanukah. Sending options.", occurredAt: ago(3), authorId: staff?.id ?? null },
    { schoolId: main.id, type: "EMAIL", summary: "[test] Sent the volunteer manual", occurredAt: ago(12), authorId: staff?.id ?? null },
    { schoolId: main.id, type: "VISIT", summary: "[test] Went in to set up the live screen", detail: "Screen is up in the lobby by the office.", occurredAt: ago(26), authorId: staff?.id ?? null },
    { schoolId: main.id, type: "MEETING", summary: "[test] Walkthrough with the principal", occurredAt: ago(48), authorId: staff?.id ?? null },
  ],
});

// A write-up from the ground. A student's name lives only on their
// supervisor's page, and the figure is always their estimate.
const ambassador = await prisma.programAmbassador.findFirst({
  where: { schoolId: main.id },
  select: { id: true },
});

if (ambassador) {
  await prisma.eventReport.deleteMany({ where: { ambassadorId: ambassador.id } });
  const ran = await prisma.programEvent.findFirst({
    where: { schoolId: main.id, startsAt: { lt: new Date() } },
    orderBy: { startsAt: "desc" },
    select: { id: true },
  });

  await prisma.eventReport.createMany({
    data: [
      {
        ambassadorId: ambassador.id,
        eventId: ran?.id ?? null,
        occurredOn: ago(5),
        participants: 130,
        whatHappened: "We set the booth up outside the lunchroom for both lunches. Most people took a candy and a lot of the younger grades wrote notes.",
        wentWell: "The notes to soldiers went fastest — we ran out of pads by the second lunch.",
        wouldChange: "We needed two more people at the start, it was very busy for the first ten minutes.",
        submittedAt: ago(4),
        seenBySupervisorAt: null,
      },
      {
        ambassadorId: ambassador.id,
        eventId: null,
        occurredOn: ago(34),
        participants: 90,
        whatHappened: "Ran the booth at the Rosh Chodesh assembly. Quieter than the lunchroom but a lot of teachers came over.",
        wentWell: "Teachers taking part made the younger grades join in.",
        submittedAt: ago(33),
        seenBySupervisorAt: ago(31),
      },
    ],
  });
}

// A school asking for something, which is the one inbound path there is.
await prisma.planChangeRequest.deleteMany({ where: { schoolId: main.id } });
await prisma.planChangeRequest.create({
  data: {
    schoolId: main.id,
    message: "We have eight more teachers starting after Sukkos. Can we add seats?",
    wantsSeats: 33,
    status: "OPEN",
  },
});

// ─── B and C: the two on the traffic light ──────────────────────────────────

const OTHERS = [
  {
    slug: "joc-test-school-b",
    name: "JOC Test School B",
    region: "Lakewood",
    city: "Lakewood",
    status: "TRIAL",
    appSchoolId: "joc-test-school-b",
    light: "AMBER",
    reason: "Set by hand for testing. Amber is 'talk it through before contacting'.",
    // On the app and reporting.
    stats: {
      minutesThisWeek: 410, minutesThisCycle: 1_980, minutesThisYear: 6_200,
      unapprovedMinutes: 240, unapprovedEntries: 4, unapprovedStudents: 3,
      unapprovedOldestAt: ago(4), unapprovedThisWeek: 3, unapprovedOneToTwo: 1, unapprovedOverTwo: 0,
      activeStudents: 34, activeStudentsLast: 29,
      opportunitiesOpen: 2, opportunitiesThisWeek: 1, opportunitiesThisCycle: 4,
      lastActivityAt: ago(1), lastActivityText: "A student logged 25 minutes visiting a neighbour.",
    },
    appStage: "RUNNING",
    contact: { name: "Mrs. C. Brody", title: "Chesed coordinator", phone: "(732) 555-0177" },
  },
  {
    slug: "joc-test-school-c",
    name: "JOC Test School C",
    region: "Monsey",
    city: "Monsey",
    status: "PROSPECT",
    appSchoolId: "joc-test-school-c",
    light: "RED",
    reason: "Set by hand for testing. Red is 'don't pitch this program now'.",
    // On the app and never reported: the honest empty state, which the
    // dashboard has to say in words rather than as a zero.
    stats: null,
    appStage: "PAUSED",
    contact: { name: "Rabbi M. Guttman", title: "Menahel", phone: "(845) 555-0119" },
  },
];

for (const o of OTHERS) {
  const school = await prisma.school.upsert({
    where: { slug: o.slug },
    create: {
      slug: o.slug, name: o.name, region: o.region, city: o.city,
      status: o.status, appSchoolId: o.appSchoolId,
      type: "DAY_SCHOOL", enrollment: "SMALL", studentCount: 140,
      accountManagerId: staff?.id ?? null,
    },
    update: { name: o.name, region: o.region, city: o.city, status: o.status, appSchoolId: o.appSchoolId },
  });

  await prisma.schoolContact.deleteMany({ where: { schoolId: school.id } });
  await prisma.schoolContact.create({
    data: { schoolId: school.id, ...o.contact, isPrimary: true },
  });

  if (o.stats) {
    await prisma.appSchoolStats.upsert({
      where: { schoolId: school.id },
      create: { schoolId: school.id, ...o.stats, syncedAt: new Date() },
      update: { ...o.stats, syncedAt: new Date() },
    });
  } else {
    await prisma.appSchoolStats.deleteMany({ where: { schoolId: school.id } });
  }

  // In the JOC App at a stage of its own, so "Schools in" has more than one
  // kind of row to show.
  await prisma.programEnrollment.deleteMany({ where: { schoolId: school.id } });
  await prisma.programEnrollment.create({
    data: {
      schoolId: school.id,
      programId: jocApp.id,
      stage: o.appStage,
      stageSince: ago(o.appStage === "PAUSED" ? 70 : 40),
    },
  });

  // And not in the Kindness Booth, carrying a light somebody set by hand.
  await prisma.schoolProgramLight.deleteMany({ where: { schoolId: school.id } });
  await prisma.schoolProgramLight.create({
    data: {
      schoolId: school.id,
      programId: kindnessBooth.id,
      light: o.light,
      reason: o.reason,
      source: "MANUAL",
      setById: staff?.id ?? null,
      setAt: ago(6),
      until: ahead(60),
    },
  });
}

// ─── What it looks like now ─────────────────────────────────────────────────

for (const slug of TEST_SLUGS) {
  const s = await prisma.school.findUnique({
    where: { slug },
    select: {
      name: true, status: true, appSchoolId: true,
      appStats: { select: { unapprovedMinutes: true } },
      _count: {
        select: {
          members: true, contacts: true, activities: true, invitations: true,
          enrollments: true, ambassadors: true, programLights: true,
          appChallenges: true, appMessages: true, planRequests: true,
        },
      },
    },
  });
  if (!s) continue;
  const c = s._count;
  console.log(
    `${s.name.padEnd(20)} ${s.status.padEnd(8)} app:${s.appStats ? "reporting" : "never reported"} ` +
    `contacts:${c.contacts} people:${c.members} invites:${c.invitations} log:${c.activities} ` +
    `in:${c.enrollments} lights:${c.programLights} challenges:${c.appChallenges} messages:${c.appMessages} asks:${c.planRequests}`,
  );
}

console.log(`\nWrite-ups on the main school: ${await prisma.eventReport.count()}`);

await prisma.$disconnect();
