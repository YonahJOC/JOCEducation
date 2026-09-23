"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canRunOwnSchool, canRunSchoolApp } from "@/lib/access";
import {
  myAmbassadorship, checkCode, newCode, INVITE_DAYS, PLACES_PER_PROGRAM,
} from "@/lib/ambassadors";

/**
 * The ambassador platform's writes.
 *
 * Nothing here sends anything to anybody. A code is handed over by a teacher
 * in person; a report is read in the portal. Ambassadors are children, and
 * the portal has no business putting a message in front of one.
 */

type Result = { ok: true; message: string } | { ok: false; error: string };

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

// ─── The teacher's side ──────────────────────────────────────────────────────

/**
 * Whoever at the school may hand out places.
 *
 * The account holder, or a teacher who runs the school's app. Not JOC: an
 * ambassador's supervisor has to be somebody in the building who will
 * actually read what the student writes.
 */
async function requireTeacher() {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  const session = await safeAuth();
  const me = session?.user;
  if (!me?.id || !me.schoolId) throw new Error("You are not attached to a school.");
  if (!canRunOwnSchool(me) && !canRunSchoolApp(me)) {
    throw new Error("Only your school's account holder or app admin can do this.");
  }
  return { id: me.id, schoolId: me.schoolId };
}

/**
 * Make a join code for one program.
 *
 * Scoped to the teacher's own school, taken from their session rather than
 * from the request — the same rule as everywhere else a school id is needed.
 */
export async function createInvite(programId: number): Promise<
  { ok: true; code: string; expiresOn: string } | { ok: false; error: string }
> {
  try {
    const me = await requireTeacher();

    const program = await prisma.programPage.findUnique({
      where: { id: programId },
      select: { id: true, name: true },
    });
    if (!program) return { ok: false, error: "That is not one of our programs." };

    // No point issuing a code for a place that does not exist.
    const taken = await prisma.programAmbassador.count({
      where: {
        schoolId: me.schoolId, programId,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
    });
    if (taken >= PLACES_PER_PROGRAM) {
      return { ok: false, error: `${program.name} already has its two ambassadors here.` };
    }

    const expiresAt = new Date(Date.now() + INVITE_DAYS * 86_400_000);

    // A collision is vanishingly unlikely and trivially survivable.
    let code = newCode();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.ambassadorInvite.count({ where: { code } });
      if (clash === 0) break;
      code = newCode();
    }

    await prisma.ambassadorInvite.create({
      data: { code, schoolId: me.schoolId, programId, createdById: me.id, expiresAt },
    });

    revalidatePath("/school/ambassadors");
    return { ok: true, code, expiresOn: day(expiresAt) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not make a code." };
  }
}

export async function revokeInvite(inviteId: string): Promise<Result> {
  try {
    const me = await requireTeacher();
    const { count } = await prisma.ambassadorInvite.updateMany({
      // Scoped to their own school, so an id from elsewhere does nothing.
      where: { id: inviteId, schoolId: me.schoolId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) return { ok: false, error: "That code is not yours, or is already cancelled." };
    revalidatePath("/school/ambassadors");
    return { ok: true, message: "Cancelled. It will not work for anybody now." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not cancel that." };
  }
}

/** End a tenure. The account stays; the scope goes. */
export async function endTenure(ambassadorId: string): Promise<Result> {
  try {
    const me = await requireTeacher();
    const { count } = await prisma.programAmbassador.updateMany({
      where: { id: ambassadorId, schoolId: me.schoolId },
      data: { endsAt: new Date() },
    });
    if (count === 0) return { ok: false, error: "That is not one of your ambassadors." };
    revalidatePath("/school/ambassadors");
    revalidatePath("/ambassador");
    return { ok: true, message: "Ended. Their place is free for somebody else." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not end that." };
  }
}

/** Mark a report read, so the student can see somebody looked at it. */
export async function markReportSeen(reportId: string): Promise<Result> {
  try {
    const me = await requireTeacher();
    const { count } = await prisma.eventReport.updateMany({
      where: { id: reportId, ambassador: { supervisorId: me.id } },
      data: { seenBySupervisorAt: new Date() },
    });
    if (count === 0) return { ok: false, error: "That report is not one of yours." };
    revalidatePath("/school/ambassadors");
    revalidatePath("/ambassador");
    return { ok: true, message: "Marked as read." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not do that." };
  }
}

/**
 * Let JOC see a report's photo.
 *
 * The teacher's decision and nobody else's. A photo of a school event has
 * other people's children in it, so it does not travel by default.
 */
export async function shareReportPhoto(reportId: string, shared: boolean): Promise<Result> {
  try {
    const me = await requireTeacher();
    const { count } = await prisma.eventReport.updateMany({
      where: { id: reportId, ambassador: { supervisorId: me.id } },
      data: { photoShared: shared },
    });
    if (count === 0) return { ok: false, error: "That report is not one of yours." };
    revalidatePath("/school/ambassadors");
    return {
      ok: true,
      message: shared ? "JOC can see the photo now." : "The photo is back to your eyes only.",
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not do that." };
  }
}

// ─── The student's side ──────────────────────────────────────────────────────

/**
 * Redeem a join code.
 *
 * The code carries the school and the program, so nothing the student types
 * decides what they get. Whoever made the code becomes their supervisor.
 */
export async function joinWithCode(raw: string): Promise<Result> {
  try {
    if (!isDatabaseConfigured()) return { ok: false, error: "Joining is not switched on yet." };
    const session = await safeAuth();
    const userId = session?.user?.id;
    if (!userId) return { ok: false, error: "Sign in first, then enter your code." };

    const check = await checkCode(raw);
    if (!check.ok) return { ok: false, error: check.reason };

    const code = raw.trim().toUpperCase().replace(/\s+/g, "");
    const invite = await prisma.ambassadorInvite.findUnique({
      where: { code },
      select: { id: true, schoolId: true, programId: true, createdById: true, program: { select: { name: true } } },
    });
    if (!invite) return { ok: false, error: "That code does not match anything." };

    const already = await prisma.programAmbassador.findUnique({
      where: {
        userId_schoolId_programId: {
          userId, schoolId: invite.schoolId, programId: invite.programId,
        },
      },
      select: { id: true, endsAt: true },
    });
    if (already && (!already.endsAt || already.endsAt > new Date())) {
      return { ok: false, error: `You already run ${invite.program.name} here.` };
    }

    if (already) {
      // Coming back after a tenure ended. Same row, new dates.
      await prisma.programAmbassador.update({
        where: { id: already.id },
        data: { startsAt: new Date(), endsAt: null, supervisorId: invite.createdById },
      });
    } else {
      await prisma.programAmbassador.create({
        data: {
          userId,
          schoolId: invite.schoolId,
          programId: invite.programId,
          supervisorId: invite.createdById,
        },
      });
    }

    await prisma.ambassadorInvite.update({
      where: { id: invite.id },
      data: { usedCount: { increment: 1 } },
    });

    revalidatePath("/ambassador");
    revalidatePath("/school/ambassadors");
    return { ok: true, message: `You are an ambassador for ${invite.program.name}.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not join with that code." };
  }
}

/**
 * Write up what happened.
 *
 * The ambassadorship is read from the session, never from the form, so a
 * report can only ever be filed against the program the student actually
 * runs.
 */
export async function submitReport(input: {
  occurredOn: string;
  participants: string;
  whatHappened: string;
  wentWell: string;
  wouldChange: string;
  eventId?: number | null;
}): Promise<Result> {
  try {
    const scope = await myAmbassadorship();
    if (!scope) return { ok: false, error: "You are not down as running a program right now." };

    const text = input.whatHappened.trim();
    if (!text) return { ok: false, error: "Say what happened — a couple of lines is plenty." };

    const on = new Date(`${input.occurredOn}T12:00:00`);
    if (Number.isNaN(on.getTime())) return { ok: false, error: "That date could not be read." };
    if (on.getTime() > Date.now() + 86_400_000) {
      return { ok: false, error: "That date is in the future. Report it after it happens." };
    }

    let participants: number | null = null;
    if (input.participants.trim()) {
      const n = Number(input.participants.trim());
      if (!Number.isFinite(n) || n < 0 || n > 5000) {
        return { ok: false, error: "That is not a number of students." };
      }
      participants = Math.round(n);
    }

    // Tie it to the calendar where the dates line up, so JOC can see which
    // planned events actually happened — and, more usefully, which reports
    // are of things the calendar never knew about.
    const nearby = input.eventId
      ? await prisma.programEvent.findFirst({
          where: { id: input.eventId, schoolId: scope.schoolId, programId: scope.programId },
          select: { id: true },
        })
      : await prisma.programEvent.findFirst({
          where: {
            schoolId: scope.schoolId,
            programId: scope.programId,
            startsAt: {
              gte: new Date(on.getTime() - 2 * 86_400_000),
              lte: new Date(on.getTime() + 2 * 86_400_000),
            },
          },
          select: { id: true },
        });

    await prisma.eventReport.create({
      data: {
        ambassadorId: scope.id,
        eventId: nearby?.id ?? null,
        occurredOn: on,
        participants,
        whatHappened: text,
        wentWell: input.wentWell.trim() || null,
        wouldChange: input.wouldChange.trim() || null,
      },
    });

    revalidatePath("/ambassador");
    revalidatePath("/school/ambassadors");
    return {
      ok: true,
      message: `Saved. ${scope.supervisor.name ?? "Your teacher"} can read it now.`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that." };
  }
}
