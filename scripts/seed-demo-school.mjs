import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

/**
 * A school to try the demo portal on.
 *
 * Makes one fake school, one sign-in for it, and enough on its hallway
 * screen that the page is not an empty box. Safe to run more than once —
 * everything is keyed on the slug and the email, so a second run resets the
 * password rather than making a second school.
 *
 * Nothing real is touched:
 *
 *   isTest = true      keeps it out of your desk, the buzz feed, the
 *                      interactions list and the screens console. It still
 *                      appears under Console → Schools, which is where the
 *                      demo switch lives.
 *   .test address      a reserved TLD. No mail can reach it even by
 *                      accident, which is the point — no school hears from
 *                      us until JOC says so.
 *
 * Run:  node --env-file=.env scripts/seed-demo-school.mjs
 * Undo: node --env-file=.env scripts/seed-demo-school.mjs --remove
 */

const SLUG = "demo-academy";
const NAME = "Demo Academy";
const EMAIL = "head@demo-academy.test";

const scrypt = promisify(_scrypt);
const N = 16384, R = 8, P = 1, KEYLEN = 64;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/** The app's own readable one-time password, same shape as the console issues. */
function generatePassword() {
  const words = ["chesed", "torah", "shalom", "kindness", "mitzvah", "tzedakah",
    "simcha", "emes", "rachamim", "achdus", "hakaras", "middos"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${pick()}-${100 + Math.floor(Math.random() * 900)}`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const day = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  if (process.argv.includes("--remove")) {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.school.deleteMany({ where: { slug: SLUG } });
    console.log(`Removed ${NAME} and ${EMAIL}.`);
    return;
  }

  // The migration has to be in first, or demoAt does not exist yet.
  try {
    await prisma.$queryRawUnsafe('SELECT "demoAt" FROM "School" LIMIT 1');
  } catch {
    console.error(
      "The demoAt column is missing. Apply the migration first:\n\n" +
      "  node --env-file=.env scripts/apply-migration.mjs 20261015100000_school_demo\n",
    );
    process.exitCode = 1;
    return;
  }

  const school = await prisma.school.upsert({
    where: { slug: SLUG },
    update: {
      demoAt: new Date(),
      isTest: true,
      screenShortName: "Demo Academy",
      screenGradeGoal: 500,
    },
    create: {
      slug: SLUG,
      name: NAME,
      city: "Teaneck",
      region: "New Jersey",
      status: "DEMO_SCHEDULED",
      studentCount: 412,
      isTest: true,
      demoAt: new Date(),
      screenShortName: "Demo Academy",
      screenGradeGoal: 500,
      screenEmailDomains: ["demo-academy.test"],
    },
    select: { id: true, name: true },
  });

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      passwordHash,
      // Deliberately false: this account exists to be looked at, and a
      // forced password change is a wall in front of the thing you came
      // to see. Do not copy this for a real school.
      mustChangePassword: false,
      active: true,
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
    },
    create: {
      email: EMAIL,
      name: "Mrs. Shira Feldman",
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
      passwordHash,
      mustChangePassword: false,
      emailVerified: new Date(),
    },
  });

  // Something on the screen, so the page is not an empty frame.
  await prisma.screenDedication.deleteMany({ where: { schoolId: school.id } });
  await prisma.screenDedication.create({
    data: {
      schoolId: school.id,
      date: day(0),
      hebrewName: "Chaya bas Avraham a\u2019\u2019h",
      text: "The chesed programme at Demo Academy is dedicated in her memory",
    },
  });

  // All three use the PROGRAM template, which draws an icon, the name huge
  // and one line under it.
  //
  // The EVENT template is built around a photograph, and these are seeded
  // without one \u2014 it left a blank grey block where the picture goes, and the
  // name, set at the size a photo-less layout gives it, ran off the edge of
  // the flyer. A demo school's screen is the first thing they see; it should
  // not open on a broken poster. Real schools upload a photo and use EVENT.
  //
  // Names are kept short on purpose: this template sets them at 124px on a
  // 1920 screen and does not wrap, which is the whole point of it.
  await prisma.screenFlyer.deleteMany({ where: { schoolId: school.id } });
  await prisma.screenFlyer.createMany({
    data: [
      {
        schoolId: school.id, template: "PROGRAM", status: "APPROVED",
        title: "Kindness Booth", line: "11th Grade \u00b7 Thursday 2:00 PM",
        icon: "storefront", showFrom: day(-1), showUntil: day(4), sort: 0,
      },
      {
        schoolId: school.id, template: "PROGRAM", status: "APPROVED",
        title: "Build A Bed", line: "Gap year \u00b7 Sunday 9:30 AM",
        icon: "bed", showFrom: day(-1), showUntil: day(10), sort: 1,
      },
      {
        schoolId: school.id, template: "PROGRAM", status: "PENDING",
        title: "Bake for Chesed", line: "9th & 10th \u00b7 After school",
        icon: "bakery_dining", showFrom: day(0), showUntil: day(8), sort: 2,
      },
    ],
  });

  console.log(`
  ${NAME} is ready, on the demo portal.

    Address   /login
    Email     ${EMAIL}
    Password  ${password}

  Two pages: Live screen, and People. Everything else sends you back to
  the screen — try typing /school/plan into the address bar.

  One flyer is left PENDING on purpose, so the approve queue has something
  in it. Run this again any time to reset the password.
  `);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
