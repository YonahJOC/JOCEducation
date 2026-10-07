"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { isSuperAdminEmail } from "@/lib/access";
import { canReadBuzz } from "@/lib/buzz-access";

/**
 * One person's list, and the board everybody reads.
 *
 * The list is theirs alone — every action here is scoped to the signed-in
 * user and takes no user id from the caller, so there is no request that can
 * tick somebody else's item.
 */

export type DeskResult = { ok: true; id?: string } | { ok: false; error: string };

async function meId(): Promise<string | null> {
  const session = await safeAuth();
  return session?.user?.id ?? null;
}

/** Type it, press Enter. */
export async function addTodo(text: string): Promise<DeskResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  const body = text.trim().slice(0, 500);
  if (!body) return { ok: false, error: "Write something first." };

  try {
    const made = await prisma.deskTodo.create({
      data: { userId: id, text: body, source: "MINE" },
      select: { id: true },
    });
    revalidatePath("/admin");
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/**
 * Tick it, or untick it.
 *
 * An item that came off the Buzz marks the note done for everybody as well:
 * the whole point of taking it was to be the person dealing with it, and
 * saying so twice is how one of the two goes stale.
 */
export async function setTodoDone(todoId: string, done: boolean): Promise<DeskResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  const row = await prisma.deskTodo.findFirst({
    where: { id: todoId, userId: id },
    select: { id: true, activityId: true },
  }).catch(() => null);

  if (!row) return { ok: false, error: "That isn't on your list." };

  try {
    await prisma.deskTodo.update({
      where: { id: row.id },
      data: { doneAt: done ? new Date() : null },
    });

    if (row.activityId) {
      await prisma.schoolActivity.update({
        where: { id: row.activityId },
        data: done
          ? { doneAt: new Date(), doneById: id, takenDoneAt: new Date() }
          : { doneAt: null, doneById: null, takenDoneAt: null },
      }).catch(() => null);
    }

    revalidatePath("/admin");
    revalidatePath("/buzz");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Take it off the list entirely. */
export async function removeTodo(todoId: string): Promise<DeskResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  try {
    await prisma.deskTodo.deleteMany({ where: { id: todoId, userId: id } });
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Read a notice. Per person. */
export async function readNotice(noticeId: string): Promise<DeskResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  try {
    await prisma.noticeRead.upsert({
      where: { userId_noticeId: { userId: id, noticeId } },
      create: { userId: id, noticeId },
      update: {},
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/**
 * Pin something for the whole office.
 *
 * Super admin only for now. The design has it open to anybody on a department
 * team, but there is no such thing in the data yet — a board anybody can post
 * to, before there is a notion of whose department it is, is a board that
 * fills with things nobody owns.
 */
export async function pinNotice(
  dept: string, title: string, body: string, weeks: number,
): Promise<DeskResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const session = await safeAuth();
  const me = session?.user;
  if (!isSuperAdminEmail(me?.email)) {
    return { ok: false, error: "Only a super admin can pin a notice." };
  }
  if (!(await canReadBuzz(me))) return { ok: false, error: "No access." };

  const head = title.trim().slice(0, 60);
  if (!head) return { ok: false, error: "It needs a headline." };

  try {
    await prisma.notice.create({
      data: {
        dept: dept.trim().slice(0, 40) || "JOC",
        title: head,
        body: body.trim().slice(0, 500),
        authorId: me?.id ?? null,
        takeDownAt: new Date(Date.now() + Math.max(1, weeks) * 7 * 86400000),
      },
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Take a notice down early. */
export async function unpinNotice(noticeId: string): Promise<DeskResult> {
  const session = await safeAuth();
  if (!isSuperAdminEmail(session?.user?.email)) {
    return { ok: false, error: "Only a super admin can take one down." };
  }
  try {
    await prisma.notice.delete({ where: { id: noticeId } });
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}
