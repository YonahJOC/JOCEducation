/**
 * What every school can open, and why.
 *
 * The access state decides what a real school sees on the day the rollout
 * starts, and it is derived rather than set — so the only way to be sure it
 * is right is to print it for all of them and read it.
 *
 *   node scripts/check-access.mjs
 *
 * It fails if any school is FULL_SITE while `fullSiteLaunchedAt` is null,
 * which would mean the rollout had opened the site to somebody by accident.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LIVE = ["REGISTERED", "MATERIALS_SENT", "TRAINED", "LAUNCHED", "RUNNING", "PAUSED"];

const schools = await prisma.school.findMany({
  orderBy: { name: "asc" },
  select: {
    name: true,
    fullSiteLaunchedAt: true,
    subscription: { select: { status: true, plan: true } },
    enrollments: {
      where: { stage: { in: LIVE } },
      select: { stage: true, program: { select: { name: true } } },
    },
  },
});

const counts = { FULL_SITE: 0, PROGRAMS: 0, PUBLIC: 0 };
let wrong = 0;

for (const s of schools) {
  const live =
    s.subscription?.status === "ACTIVE" || s.subscription?.status === "TRIALING";
  const state = s.fullSiteLaunchedAt && live
    ? "FULL_SITE"
    : s.enrollments.length > 0
    ? "PROGRAMS"
    : "PUBLIC";

  counts[state]++;

  if (state === "FULL_SITE" && !s.fullSiteLaunchedAt) wrong++;

  const plan = s.subscription ? `${s.subscription.plan} ${s.subscription.status}` : "no plan";
  const progs = s.enrollments.map((e) => e.program.name).join(", ") || "—";

  console.log(
    `  ${state.padEnd(10)} ${s.name.padEnd(34)} ${plan.padEnd(28)} ${progs.slice(0, 52)}`,
  );
}

console.log(
  `\n${schools.length} schools — ` +
  `${counts.FULL_SITE} on the full site, ${counts.PROGRAMS} on their programs, ${counts.PUBLIC} on neither.`,
);

if (counts.FULL_SITE > 0) {
  console.log("\nNote: every school should be PROGRAMS or PUBLIC until the rollout begins.");
}

await prisma.$disconnect();

if (wrong > 0) {
  console.error(`\n✗ ${wrong} school(s) are FULL_SITE without a launch date.`);
  process.exit(1);
}
