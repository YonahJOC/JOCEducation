"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { isSuperAdminEmail } from "@/lib/access";
import { canReadBuzz } from "@/lib/buzz-access";

/**
 * What can be done to one item on the Buzz.
 *
 * Two different bars, on purpose:
 *
 *   comment   anybody who can read the Buzz, because somebody who knows the
 *             school often knows the answer, and the place to say so is under
 *             the thing itself rather than in a message nobody else sees
 *   edit,     a super admin. Changing what somebody wrote down, handing it to
 *   tag,      a named person, or taking it off the feed are all decisions
 *   remove    about the record rather than contributions to it
 */

export type ItemResult = { ok: true } | { ok: false; error: string };

type Me = { id?: string | null; email?: string | null; role?: string | null; capabilities?: string[] | null };

async function me(): Promise<Me> {
  const session = await safeAuth();
  return (session?.user ?? {}) as Me;
}

/** The super admin bar. Yonah, Jerry and Avir — nobody else, ever. */
async function asSuperAdmin(): Promise<{ user: Me; ok: boolean }> {
  const user = await me();
  return { user, ok: openForReview || isSuperAdminEmail(user.email) };
}

/** The reading bar: whoever may see the Buzz may add to a thread on it. */
async function asReader(): Promise<{ user: Me; ok: boolean }> {
  const user = await me();
  return { user, ok: await canReadBuzz(user) };
}

function touched() {
  revalidatePath("/buzz");
  revalidatePath("/admin/my-updates");
  revalidatePath("/admin/interactions");
}

/** A comment. The first one starts the thread. */
export async function addNote(activityId: string, body: string): Promise<ItemResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { user, ok } = await asReader();
  if (!ok) return { ok: false, error: "You can't comment on the Buzz." };

  const text = body.trim();
  if (!text) return { ok: false, error: "Write something first." };

  try {
    await prisma.buzzNote.create({
      data: { activityId, authorId: user.id ?? null, body: text.slice(0, 4000) },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  touched();
  return { ok: true };
}

/** Change what was written down. Super admin only. */
export async function editUpdate(activityId: string, detail: string): Promise<ItemResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { ok } = await asSuperAdmin();
  if (!ok) return { ok: false, error: "Only a super admin can edit an entry." };

  try {
    await prisma.schoolActivity.update({
      where: { id: activityId },
      data: { detail: detail.trim().slice(0, 8000) || null },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  touched();
  return { ok: true };
}

/**
 * Hand it to somebody — the same field a coordinator sets by picking it up,
 * so a tagged item lands in exactly the same place as one they took.
 */
export async function assignUpdate(activityId: string, userId: string | null): Promise<ItemResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { ok } = await asSuperAdmin();
  if (!ok) return { ok: false, error: "Only a super admin can tag somebody." };

  if (userId) {
    const them = await prisma.user.findUnique({
      where: { id: userId }, select: { schoolId: true },
    }).catch(() => null);
    if (!them) return { ok: false, error: "That person is no longer here." };
    if (them.schoolId) return { ok: false, error: "That account belongs to a school." };
  }

  try {
    await prisma.schoolActivity.update({
      where: { id: activityId },
      data: userId
        ? { takenById: userId, takenAt: new Date(), takenDoneAt: null }
        : { takenById: null, takenAt: null, takenDoneAt: null },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  touched();
  return { ok: true };
}

/** Take it off the feed, or put it back. Never a DELETE — see the schema. */
export async function removeUpdate(activityId: string, removed: boolean): Promise<ItemResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { user, ok } = await asSuperAdmin();
  if (!ok) return { ok: false, error: "Only a super admin can remove an entry." };

  try {
    await prisma.schoolActivity.update({
      where: { id: activityId },
      data: removed
        ? { removedAt: new Date(), removedById: user.id ?? null }
        : { removedAt: null, removedById: null },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  touched();
  return { ok: true };
}
