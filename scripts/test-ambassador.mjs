import { PrismaClient } from "@prisma/client";

/**
 * Put a test ambassador and a test report on the JOC Test School, so the
 * ambassador pages and the console rollup can be looked at with something in
 * them.
 *
 *   node --env-file=.env scripts/test-ambassador.mjs
 *   node --env-file=.env scripts/test-ambassador.mjs --remove
 */

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const remove = process.argv.includes("--remove");

const school = await prisma.school.findFirst({ where: { name: { contains: "Test School" } } });
if (!school) { console.log("No JOC Test School — run scripts/test-school.mjs first."); process.exit(1); }

const program = await prisma.programPage.findFirst({ where: { slug: "joc-app" } });
if (!program) { console.log("No joc-app program."); process.exit(1); }

// Deliberately not a @justonechesed.org address. A student never has one,
// and seeding it that way put the test student in the console's coordinator
// picker — which reads as an ambassador's name leaking onto a JOC screen
// when it is nothing of the sort.
const STUDENT = "test.ambassador@jocteststudent.org";

if (remove) {
  const u = await prisma.user.findUnique({ where: { email: STUDENT } });
  if (u) {
    await prisma.programAmbassador.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
  }
  await prisma.ambassadorInvite.deleteMany({ where: { schoolId: school.id } });
  console.log("removed");
  await prisma.$disconnect();
  process.exit(0);
}

// A supervisor: whoever at JOC is around. In real life this is a teacher at
// the school, but the test school has no staff of its own.
const supervisor = await prisma.user.findFirst({
  where: { email: { endsWith: "@justonechesed.org" }, NOT: { email: STUDENT } },
  orderBy: { email: "asc" },
});

const student = await prisma.user.upsert({
  where: { email: STUDENT },
  create: { email: STUDENT, name: "Test Ambassador", role: "TEACHER" },
  update: {},
});

const amb = await prisma.programAmbassador.upsert({
  where: { userId_schoolId_programId: { userId: student.id, schoolId: school.id, programId: program.id } },
  create: {
    userId: student.id, schoolId: school.id, programId: program.id,
    supervisorId: supervisor.id,
  },
  update: { endsAt: null },
});

const existing = await prisma.eventReport.count({ where: { ambassadorId: amb.id } });
if (existing === 0) {
  await prisma.eventReport.create({
    data: {
      ambassadorId: amb.id,
      occurredOn: new Date(Date.now() - 3 * 86_400_000),
      participants: 42,
      whatHappened: "We ran the booth at lunch on Tuesday. Most of the ninth grade came through and a lot of them stayed longer than we expected. We ran out of cards about twenty minutes in.",
      wentWell: "Having two of us meant one could always be explaining while the other wrote things down.",
      wouldChange: "More cards. And a table nearer the door.",
    },
  });
}

const invite = await prisma.ambassadorInvite.create({
  data: {
    code: "TEST99",
    schoolId: school.id,
    programId: program.id,
    createdById: supervisor.id,
    expiresAt: new Date(Date.now() + 30 * 86_400_000),
  },
}).catch(async () => prisma.ambassadorInvite.findUnique({ where: { code: "TEST99" } }));

console.log(`school      ${school.name}`);
console.log(`program     ${program.name}`);
console.log(`supervisor  ${supervisor.name ?? supervisor.email}`);
console.log(`student     ${student.email}`);
console.log(`ambassador  ${amb.id}`);
console.log(`reports     ${await prisma.eventReport.count({ where: { ambassadorId: amb.id } })}`);
console.log(`join code   ${invite?.code ?? "already existed"}`);

await prisma.$disconnect();
