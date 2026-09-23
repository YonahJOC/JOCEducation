"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, openForReview } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { can } from "@/lib/access";
import { STAGE_LABEL, backfillEnrollments, type Stage } from "@/lib/program-enrollment";
import { recomputeSchoolLights } from "@/lib/program-lights";

/**
 * Moving a school through a program.
 *
 * The coordinator who runs the program does this, so the permission is being
 * down as its lead — the same rule the traffic light uses. Nothing here
 * reaches the school; a stage is JOC's own record of where things have got to.
 */

type Result = { ok: true; message: string } | { ok: false; error: string };

async function requireProgram(programId: number) {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  const session = await safeAuth();
  const me = session?.user ?? null;
  if (openForReview) return me;

  const lead = me?.id
    ? (await prisma.programPage.count({ where: { id: programId, leads: { some: { id: me.id } } } })) > 0
    : false;

  if (lead || can(me, "programs") || can(me, "schools") || can(me, "set_program_light")) return me;
  throw new Error("You are not down as running this program.");
}

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

function refresh(slug: string, schoolId?: string) {
  revalidatePath(`/admin/programs/${slug}`);
  revalidatePath("/admin/my-programs");
  if (schoolId) revalidatePath(`/admin/schools/${schoolId}`);
}

/**
 * Move a school to a stage.
 *
 * Writes the moment it changed, so "how long has this school been sitting at
 * registered" has an answer. Also writes a line to the school's own activity
 * log: the account team reads that, and a program going live at a school is
 * exactly the sort of thing they should not learn by accident.
 */
export async function setStage(
  programId: number,
  slug: string,
  schoolId: string,
  stage: Stage,
  note?: string,
): Promise<Result> {
  try {
    const me = await requireProgram(programId);
    if (!STAGE_LABEL[stage]) return { ok: false, error: "That is not one of the stages." };

    const program = await prisma.programPage.findUnique({
      where: { id: programId },
      select: { name: true },
    });
    if (!program) return { ok: false, error: "That program no longer exists." };

    const now = new Date();
    const before = await prisma.programEnrollment.findUnique({
      where: { schoolId_programId: { schoolId, programId } },
      select: { stage: true },
    });
    if (before?.stage === stage) {
      return { ok: true, message: `Already at ${STAGE_LABEL[stage].toLowerCase()}.` };
    }

    // The first time it actually runs somewhere is worth keeping separately
    // from the stage, which can go backwards.
    const startsNow = stage === "LAUNCHED" || stage === "RUNNING";

    await prisma.programEnrollment.upsert({
      where: { schoolId_programId: { schoolId, programId } },
      create: {
        schoolId, programId, stage, stageSince: now,
        note: note?.trim() || null,
        startedAt: startsNow ? now : null,
        endedAt: stage === "ENDED" ? now : null,
      },
      update: {
        stage, stageSince: now,
        ...(note?.trim() ? { note: note.trim() } : {}),
        ...(startsNow ? { startedAt: before ? undefined : now } : {}),
        ...(stage === "ENDED" ? { endedAt: now } : { endedAt: null }),
      },
    });

    await prisma.schoolActivity.create({
      data: {
        schoolId,
        type: "STATUS_CHANGE",
        summary: `${program.name} — ${STAGE_LABEL[stage].toLowerCase()}`,
        detail: note?.trim() || null,
        authorId: me?.id ?? null,
        occurredAt: now,
      },
    });

    // Being in one program is what turns this school amber on the others.
    await recomputeSchoolLights(schoolId);

    refresh(slug, schoolId);
    return { ok: true, message: `Moved to ${STAGE_LABEL[stage].toLowerCase()} on ${day(now)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that." };
  }
}

/** Say who at the school runs this program. */
export async function setEnrollmentContact(
  programId: number,
  slug: string,
  schoolId: string,
  contactId: string | null,
): Promise<Result> {
  try {
    await requireProgram(programId);
    await prisma.programEnrollment.update({
      where: { schoolId_programId: { schoolId, programId } },
      data: { contactId: contactId || null },
    });
    refresh(slug, schoolId);
    return { ok: true, message: contactId ? "Saved." : "Nobody named." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that." };
  }
}

/**
 * Put a school into a program at the first stage.
 *
 * What "Reach out" on the traffic light does once the call has been logged —
 * the school stops being one nobody has spoken to, and starts being one at
 * the beginning of the list.
 */
export async function startProgram(
  programId: number,
  slug: string,
  schoolId: string,
  note?: string,
): Promise<Result> {
  return setStage(programId, slug, schoolId, "INTRODUCED", note);
}

/**
 * Work out enrollments from the calendar and the sign-ups.
 *
 * Only ever creates. A stage somebody set by hand is a decision, and a
 * backfill that overwrote one would be worse than no backfill at all.
 */
export async function reconcileEnrollments(slug: string): Promise<Result> {
  try {
    const session = await safeAuth();
    if (!openForReview && !can(session?.user, "programs") && !can(session?.user, "schools")) {
      return { ok: false, error: "This needs the Programs or Schools permission." };
    }
    const r = await backfillEnrollments();
    refresh(slug);
    return {
      ok: true,
      message:
        r.created === 0
          ? `Nothing to add — all ${r.scanned} school and program pairs on the calendar and the sign-ups are already here.`
          : `Added ${r.created} of ${r.scanned} school and program pairs from the calendar and the sign-ups.`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reconcile that." };
  }
}
