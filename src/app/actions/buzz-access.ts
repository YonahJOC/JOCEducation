"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * Who may read the Buzz, one person at a time.
 *
 * Kept apart from admin types on purpose: a type says what a job can do, and
 * this is a list of named people somebody chose. Mixing them means granting
 * the Buzz by changing what the whole programming team can do.
 *
 * Only somebody who can already manage people may change this list — the same
 * bar as handing out any other access.
 */

export type AccessResult = { ok: true } | { ok: false; error: string };

async function guard(): Promise<AccessResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "users")) {
    return { ok: false, error: "You can't change who has access." };
  }
  return { ok: true };
}

export async function setBuzzAccess(userId: string, on: boolean): Promise<AccessResult> {
  const allowed = await guard();
  if (!allowed.ok) return allowed;

  const who = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, schoolId: true },
  }).catch(() => null);

  if (!who) return { ok: false, error: "That person is no longer here." };

  // The Buzz is every school's history on one screen, so somebody tied to one
  // school is refused here as well as at the page itself — otherwise this
  // list would say they have something they cannot actually open.
  if (on && who.schoolId) {
    return { ok: false, error: "That account belongs to a school, so it can't see the Buzz." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { buzzAccess: on } });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  revalidatePath("/admin/buzz");
  revalidatePath("/buzz");
  return { ok: true };
}
