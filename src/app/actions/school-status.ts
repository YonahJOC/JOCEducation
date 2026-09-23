"use server";

import { revalidatePath } from "next/cache";
import { safeAuth, openForReview } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { can } from "@/lib/access";
import { recomputeSchoolLights } from "@/lib/program-lights";

/**
 * Recording where a school is up to.
 *
 * All of it is account work — who paid, who sent their list, whether the
 * screen is up — so it needs the Schools permission, the same one that opens
 * a school's page.
 */

type Result = { ok: true } | { ok: false; error: string };

async function requireSchools() {
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) {
    throw new Error("Your admin type does not include Schools");
  }
  return session?.user ?? null;
}

const MARKS = {
  studentList: "studentListAt",
  liveScreen: "liveScreenAt",
  store: "storeOpenAt",
} as const;

export type Mark = keyof typeof MARKS;

/**
 * Tick or untick one of the three dated milestones.
 *
 * Ticking records today. Unticking clears the date rather than writing a
 * false one — a school that never sent a list and a school whose list we
 * lost look different, and should.
 */
export async function setSchoolMark(schoolId: string, mark: Mark, on: boolean): Promise<Result> {
  try {
    await requireSchools();
    const field = MARKS[mark];
    if (!field) return { ok: false, error: "Not something we track." };

    await prisma.school.update({
      where: { id: schoolId },
      data: { [field]: on ? new Date() : null },
    });
    revalidatePath("/admin/schools");
    revalidatePath(`/admin/schools/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that." };
  }
}

/**
 * The count of hours waiting for approval, read out of the JOC App by hand.
 *
 * Stored with the moment it was read. The number on its own would go on
 * looking authoritative months after it stopped being true, and somebody
 * would chase a school about it.
 */
export async function setUnapprovedHours(schoolId: string, hours: number | null): Promise<Result> {
  try {
    await requireSchools();
    if (hours !== null && (!Number.isFinite(hours) || hours < 0)) {
      return { ok: false, error: "That is not a number of hours." };
    }
    await prisma.school.update({
      where: { id: schoolId },
      data: {
        unapprovedHours: hours,
        unapprovedCheckedAt: hours === null ? null : new Date(),
      },
    });
    revalidatePath("/admin/schools");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that." };
  }
}

/**
 * Log a conversation or a visit.
 *
 * A visit is its own kind rather than a meeting with a note in it, because
 * "when did somebody last go there" is a question the board has to answer on
 * its own.
 */
export async function logSchoolTouch(
  schoolId: string,
  kind: "CALL" | "EMAIL" | "MEETING" | "VISIT" | "NOTE",
  summary: string,
): Promise<Result> {
  try {
    const me = await requireSchools();
    const text = summary.trim();
    if (!text) return { ok: false, error: "Say what happened, in a line." };

    await prisma.schoolActivity.create({
      data: { schoolId, type: kind, summary: text, authorId: me?.id ?? null, occurredAt: new Date() },
    });
    // A call logged here turns this school amber on every program console.
    // Waiting for tonight would leave another coordinator ringing them today.
    await recomputeSchoolLights(schoolId);
    revalidatePath("/admin/schools");
    revalidatePath(`/admin/schools/${schoolId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not log that." };
  }
}
