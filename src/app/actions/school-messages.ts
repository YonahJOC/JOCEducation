"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { currentSchoolId } from "@/lib/school-scope";

/**
 * Talking to the people who run a school's account.
 *
 * Nothing here sends anything. A coordinator writes, the row is stored, and
 * the school reads it the next time somebody signs in to their own panel —
 * which is not us reaching out to them, so the standing rule holds and the
 * send gate in lib/email.ts stays untouched.
 *
 * That is also why there is no notification: until JOC launches, the school
 * finds out by opening the portal. Saying "we have emailed them" would be
 * false, so the console says what is true instead.
 */

export type MessageResult = { ok: true } | { ok: false; error: string };

/** JOC writing to a school. */
export async function writeToSchool(
  schoolId: string,
  programId: number | null,
  _prev: MessageResult | null,
  form: FormData,
): Promise<MessageResult> {
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools") && !can(session?.user, "app_activity")) {
    return { ok: false, error: "You can't write to a school." };
  }
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  const body = String(form.get("body") ?? "").trim();
  if (body.length < 2) return { ok: false, error: "Write a line and it will be there for them." };

  try {
    await prisma.schoolMessage.create({
      data: {
        schoolId,
        programId: programId ?? undefined,
        body: body.slice(0, 4000),
        inbound: false,
        authorId: session?.user?.id ?? undefined,
      },
    });
    revalidatePath("/admin/programs");
    revalidatePath("/school");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}

/** A school writing back, from its own panel. */
export async function writeToJOC(
  programId: number | null,
  _prev: MessageResult | null,
  form: FormData,
): Promise<MessageResult> {
  const schoolId = await currentSchoolId();
  if (!schoolId || !isDatabaseConfigured()) {
    return { ok: false, error: "Your account is not attached to a school yet." };
  }

  const body = String(form.get("body") ?? "").trim();
  if (body.length < 2) return { ok: false, error: "Write a line and we'll pass it on." };

  try {
    const session = await safeAuth();
    await prisma.schoolMessage.create({
      data: {
        schoolId,
        programId: programId ?? undefined,
        body: body.slice(0, 4000),
        inbound: true,
        authorId: session?.user?.id ?? undefined,
      },
    });
    revalidatePath("/school");
    revalidatePath("/admin/programs");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}

/**
 * Mark what the other side wrote as read.
 *
 * `mine` says which side is doing the reading, because the two directions
 * are marked by different people and a console must never clear the school's
 * unread count on their behalf.
 */
export async function markThreadSeen(schoolId: string, side: "joc" | "school"): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await prisma.schoolMessage.updateMany({
      where: { schoolId, inbound: side === "joc", seenAt: null },
      data: { seenAt: new Date() },
    });
  } catch {
    // Seen-state is a convenience. Failing to record it changes nothing real.
  }
}
