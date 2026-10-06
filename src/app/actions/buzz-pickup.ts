"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { leadsAnyProgram } from "@/lib/program-admin";

/**
 * Taking a school update off the Buzz, and putting it back.
 *
 * The Buzz is everybody's; this is how one person says "I have got this".
 * The row does not move — it stays on the school and in the feed — it gains
 * a name against it, so the next person reading the feed can see somebody is
 * already on it rather than ringing the same school twice.
 *
 * Who may: anybody who runs a program, or anybody who works the schools list.
 * A coordinator does not hold a console capability, so the capability check
 * alone would have shut out exactly the people this is for.
 */

export type PickupResult = { ok: true } | { ok: false; error: string };

type Me = { id?: string | null; email?: string | null; role?: string | null; capabilities?: string[] | null };

async function whoCanPickUp(): Promise<{ me: Me; ok: boolean }> {
  const session = await safeAuth();
  const me = (session?.user ?? {}) as Me;
  if (openForReview) return { me, ok: true };
  if (can(me, "schools")) return { me, ok: true };
  return { me, ok: await leadsAnyProgram(me.id ?? null) };
}

export async function takeUpdate(activityId: string): Promise<PickupResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { me, ok } = await whoCanPickUp();
  if (!ok) return { ok: false, error: "Only somebody who runs a program can pick these up." };
  if (!me.id) return { ok: false, error: "Sign in first." };

  const row = await prisma.schoolActivity.findUnique({
    where: { id: activityId },
    select: { takenById: true, takenBy: { select: { name: true, email: true } } },
  }).catch(() => null);

  if (!row) return { ok: false, error: "That update is no longer there." };

  // Somebody else already has it. Said plainly rather than silently taken
  // off them — two people chasing one school is the thing this prevents.
  if (row.takenById && row.takenById !== me.id) {
    const who = row.takenBy?.name ?? row.takenBy?.email ?? "somebody else";
    return { ok: false, error: `${who} already picked this up.` };
  }

  try {
    await prisma.schoolActivity.update({
      where: { id: activityId },
      data: { takenById: me.id, takenAt: new Date(), takenDoneAt: null },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  revalidatePath("/buzz");
  revalidatePath("/admin/my-updates");
  return { ok: true };
}

/** Put it back, or mark it dealt with. Only the person holding it. */
export async function releaseUpdate(activityId: string, done: boolean): Promise<PickupResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const { me, ok } = await whoCanPickUp();
  if (!ok) return { ok: false, error: "That isn't yours to change." };

  const row = await prisma.schoolActivity.findUnique({
    where: { id: activityId },
    select: { takenById: true },
  }).catch(() => null);

  if (!row) return { ok: false, error: "That update is no longer there." };
  if (row.takenById !== me.id && !can(me, "schools") && !openForReview) {
    return { ok: false, error: "Somebody else is holding this one." };
  }

  try {
    await prisma.schoolActivity.update({
      where: { id: activityId },
      data: done
        ? { takenDoneAt: new Date() }
        : { takenById: null, takenAt: null, takenDoneAt: null },
    });
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }

  revalidatePath("/buzz");
  revalidatePath("/admin/my-updates");
  return { ok: true };
}
