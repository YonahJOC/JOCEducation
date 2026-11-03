import { requireSchoolPanel } from "../account-only";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { whoISupervise } from "@/lib/ambassadors";
import { messagesFor } from "@/lib/ambassador-messages";
import { AmbassadorsPanel } from "@/components/school/AmbassadorsPanel";
import { currentSchoolId } from "@/lib/school-scope";

/**
 * Your ambassadors.
 *
 * Two students per program run it on the ground and write up what happened
 * each time. This is where their teacher hands out a place, reads what they
 * wrote, and decides whether a photo goes any further than this page.
 *
 * Only this school, and only the ambassadors this teacher supervises —
 * derived from the session, never from the address.
 */

export const metadata = { title: "Your ambassadors" };
export const dynamic = "force-dynamic";

export default async function SchoolAmbassadorsPage() {
  // Part of the demo portal: a demo of student ambassadors with no way to
  // read what they write is a demo of half of it.
  await requireSchoolPanel({ demo: "allow" });

  const session = await safeAuth();
  const schoolId = await currentSchoolId();

  const supervised = await whoISupervise();

  // Each student's thread with this teacher, loaded alongside their card.
  const threads = Object.fromEntries(
    await Promise.all(supervised.map(async (a) => [a.id, await messagesFor(a.id).catch(() => [])] as const)),
  );

  // Programs this school actually runs. Offering a place on a program they
  // have never heard of would be the platform inventing work for them.
  const programs =
    isDatabaseConfigured() && schoolId
      ? (
          await prisma.programEnrollment.findMany({
            where: { schoolId },
            orderBy: { program: { name: "asc" } },
            select: { programId: true, stage: true, program: { select: { name: true } } },
          })
        ).map((e) => ({ id: e.programId, name: e.program.name, stage: e.stage }))
      : [];

  const invites =
    isDatabaseConfigured() && schoolId
      ? (
          await prisma.ambassadorInvite.findMany({
            where: { schoolId, revokedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
            select: {
              id: true, code: true, expiresAt: true, usedCount: true, programId: true,
              program: { select: { name: true } },
            },
          })
        ).map((i) => ({
          id: i.id,
          code: i.code,
          expiresAt: i.expiresAt,
          usedCount: i.usedCount,
          programId: i.programId,
          programName: i.program.name,
        }))
      : [];

  return (
    <AmbassadorsPanel
      programs={programs}
      invites={invites}
      supervised={supervised}
      threads={threads}
    />
  );
}
