"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { isSuperAdminEmail } from "@/lib/access";
import { canReadBuzz } from "@/lib/buzz-access";

/**
 * The three things a person can do to a Buzz note, kept apart on purpose.
 *
 *   Move it to my desk   private. A task appears on one desk. The note is
 *                        untouched and nobody else sees a thing.
 *   Done for me          private. It stops nagging this one person. Still
 *                        open for everybody else.
 *   Close thread         public, super admin only. It is finished for the
 *                        whole office.
 *
 * They used to be one button, which meant somebody tidying their own view
 * closed the item for the entire organisation — and the only way to find out
 * was that nobody else dealt with it.
 */

export type R = { ok: true; id?: string } | { ok: false; error: string };

async function me() {
  const s = await safeAuth();
  return s?.user ?? null;
}

function touch() {
  revalidatePath("/admin");
  revalidatePath("/admin/office");
  revalidatePath("/buzz");
}

/** Take it: a task on my desk, and nothing posted anywhere. */
export async function moveToMyDesk(activityId: string, text: string, later: boolean): Promise<R> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const user = await me();
  if (!user?.id) return { ok: false, error: "Sign in first." };
  if (!(await canReadBuzz(user))) return { ok: false, error: "The Buzz isn't yours." };

  const body = text.trim().slice(0, 500);
  if (!body) return { ok: false, error: "Say what you'll do." };

  const item = await prisma.schoolActivity.findFirst({
    where: { id: activityId, removedAt: null },
    select: { id: true },
  }).catch(() => null);
  if (!item) return { ok: false, error: "That note has gone." };

  try {
    const made = await prisma.deskTodo.create({
      data: {
        userId: user.id, text: body, source: "BUZZ", activityId,
        whenBucket: later ? "LATER" : "TODAY",
      },
      select: { id: true },
    });
    touch();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Put it back: the task goes, the note is as it was. */
export async function takeOffMyDesk(activityId: string): Promise<R> {
  const user = await me();
  if (!user?.id) return { ok: false, error: "Sign in first." };
  await prisma.deskTodo.deleteMany({ where: { userId: user.id, activityId } }).catch(() => null);
  touch();
  return { ok: true };
}

/**
 * Done for me — and only for me.
 *
 * Ticks the linked task at the same time, because having dealt with something
 * and still having it on your list is the state everybody hates.
 */
export async function doneForMe(activityId: string, on: boolean): Promise<R> {
  const user = await me();
  if (!user?.id) return { ok: false, error: "Sign in first." };
  if (!(await canReadBuzz(user))) return { ok: false, error: "The Buzz isn't yours." };

  try {
    if (on) {
      await prisma.buzzDone.upsert({
        where: { userId_activityId: { userId: user.id, activityId } },
        create: { userId: user.id, activityId },
        update: {},
      });
      await prisma.deskTodo.updateMany({
        where: { userId: user.id, activityId, doneAt: null },
        data: { doneAt: new Date() },
      });
    } else {
      await prisma.buzzDone.deleteMany({ where: { userId: user.id, activityId } });
      await prisma.deskTodo.updateMany({ where: { userId: user.id, activityId }, data: { doneAt: null } });
    }
    touch();
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/**
 * Close it for everybody. Super admin only, both ways.
 *
 * Closing ticks every linked task, on every desk: the people who took it on
 * should not have to come back and find out it was settled without them.
 */
export async function closeThread(activityId: string, on: boolean): Promise<R> {
  const user = await me();
  if (!user?.id) return { ok: false, error: "Sign in first." };
  if (!isSuperAdminEmail(user.email)) {
    return { ok: false, error: "Only a super admin can close a thread." };
  }

  try {
    await prisma.schoolActivity.update({
      where: { id: activityId },
      data: on
        ? { closedAt: new Date(), closedById: user.id }
        : { closedAt: null, closedById: null },
    });
    if (on) {
      await prisma.deskTodo.updateMany({
        where: { activityId, doneAt: null },
        data: { doneAt: new Date() },
      });
    }
    touch();
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}
