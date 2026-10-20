/**
 * Something in Demo Academy's approval queue to look at.
 *
 * Two stages need two kinds of row to be worth showing: things nobody has
 * touched, and things a student ambassador has already passed on with their
 * name on them. This makes both, plus one a student set aside, so the
 * administrator's screen has all three of its sections filled.
 *
 * Demo only. It refuses to run against a school that is not flagged isTest,
 * so it cannot be pointed at a real school's wall by accident.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "demo-academy";

const day = (n) => new Date(Date.now() + n * 86400000);

async function main() {
  const school = await prisma.school.findUnique({
    where: { slug: SLUG },
    select: { id: true, name: true, isTest: true },
  });
  if (!school) throw new Error(`No school with slug ${SLUG}.`);
  if (!school.isTest) throw new Error(`${school.name} is not a test school. Refusing.`);

  /**
   * A student ambassador, shaped exactly like a real one.
   *
   * There is no STUDENT role: an ambassador is a TEACHER-role user with no
   * schoolId, and it is the missing schoolId that matters. screenRoleFor
   * calls somebody a teacher when their schoolId matches the school and
   * they can run it; leave schoolId set here and this "student" would be
   * handed the school's own approval powers and the queue would be a lie.
   * What makes them an ambassador is the ProgramAmbassador row below.
   */
  const student = await prisma.user.upsert({
    where: { email: "ambassador@demo-academy.test" },
    update: { name: "Rivka Mandel", schoolId: null, schoolAppAdmin: false, active: true },
    create: {
      email: "ambassador@demo-academy.test",
      name: "Rivka Mandel",
      role: "TEACHER",
      schoolId: null,
      schoolAppAdmin: false,
      active: true,
      emailVerified: new Date(),
    },
    select: { id: true, name: true },
  });

  const sender = await prisma.user.findFirst({
    where: { email: "head@demo-academy.test" },
    select: { id: true },
  });
  if (!sender) throw new Error("Run scripts/seed-demo-school.mjs first — no head@demo-academy.test.");

  /**
   * An ambassadorship is per programme and needs a supervising adult, so it
   * is hung off whichever programme exists and off the school's own head.
   * screenRoleFor only asks whether there is a live one at this school, so
   * which programme it is does not matter to the screen.
   */
  const programme = await prisma.programPage.findFirst({ select: { id: true } });
  if (!programme) throw new Error("No programme pages exist, so an ambassadorship cannot be made.");

  const already = await prisma.programAmbassador.findFirst({
    where: { userId: student.id, schoolId: school.id },
    select: { id: true },
  });
  if (!already) {
    await prisma.programAmbassador.create({
      data: {
        user: { connect: { id: student.id } },
        school: { connect: { id: school.id } },
        program: { connect: { id: programme.id } },
        supervisor: { connect: { id: sender.id } },
        startsAt: day(-7),
        endsAt: null,
      },
    });
  }

  // Clear what a previous run made, so this is repeatable.
  await prisma.screenFlyer.deleteMany({ where: { schoolId: school.id, title: { startsWith: "Demo · " } } });
  await prisma.shoutOut.deleteMany({ where: { schoolId: school.id, text: { startsWith: "Demo · " } } });

  const flyer = (title, status, endorsed) => ({
    schoolId: school.id,
    template: "EVENT",
    title: `Demo · ${title}`,
    line: "Meet by the main office",
    startsAt: day(3),
    time: "1:15pm",
    place: "Main hallway",
    showFrom: day(-1),
    showUntil: day(14),
    status,
    createdById: sender?.id ?? null,
    endorsedById: endorsed ? student.id : null,
    endorsedAt: endorsed ? day(0) : null,
  });

  await prisma.screenFlyer.createMany({
    data: [
      flyer("Bake sale for Yad Eliezer", "PENDING", false),
      flyer("Chesed fair, Thursday", "ENDORSED", true),
      flyer("Mishloach manot packing", "ENDORSED", true),
      flyer("Old notice nobody wants", "SET_ASIDE", true),
    ],
  });

  const shout = (text, first, grade, status, endorsed) => ({
    schoolId: school.id,
    text: `Demo · ${text}`,
    firstName: first,
    lastName: "",
    grade,
    showName: true,
    authorEmail: "student@demo-academy.test",
    status,
    endorsedById: endorsed ? student.id : null,
    endorsedAt: endorsed ? day(0) : null,
  });

  await prisma.shoutOut.createMany({
    data: [
      shout("Chavi stayed behind to help me carry the boxes to the car.", "Tzippy", "10th", "PENDING", false),
      shout("Mrs Adler called my grandmother every day she was in hospital.", "Shira", "11th", "ENDORSED", true),
    ],
  });

  const counts = await prisma.screenFlyer.groupBy({
    by: ["status"],
    where: { schoolId: school.id },
    _count: true,
  });

  console.log(`\n  ${school.name}: queue seeded.`);
  console.log(`  Ambassador: ${student.name} <ambassador@demo-academy.test>`);
  console.log(`  Flyers by status: ${counts.map((c) => `${c.status} ${c._count}`).join(", ")}`);
  console.log(`\n  Run again any time; it replaces what it made last time.\n`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
