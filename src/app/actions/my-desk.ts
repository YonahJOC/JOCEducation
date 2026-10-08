"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { isStaffEmail } from "@/lib/access";

/**
 * Everything a person can do at their own desk.
 *
 * Two rules hold throughout. Nothing takes a user id from the caller — the
 * owner is always the signed-in session — so there is no request shaped like
 * "tick Dalia's task". And handing work to somebody else is the one exception,
 * where the recipient is named: that is checked against the staff list, so a
 * task cannot be posted onto a school account's desk.
 */

export type R = { ok: true; id?: string } | { ok: false; error: string };

async function meId(): Promise<string | null> {
  const s = await safeAuth();
  return s?.user?.id ?? null;
}

function done() {
  revalidatePath("/admin");
  revalidatePath("/admin/office");
}

/* ---------------------------------------------------------------- tasks -- */

export async function addTask(text: string, later: boolean): Promise<R> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  const body = text.trim().slice(0, 500);
  if (!body) return { ok: false, error: "Write something first." };

  try {
    const made = await prisma.deskTodo.create({
      data: { userId: id, text: body, source: "MINE", whenBucket: later ? "LATER" : "TODAY" },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/**
 * Give it to somebody else.
 *
 * The task is theirs from this moment — it leaves this desk and appears on
 * that one. What stays here is the row read from the other end: who has it
 * and whether they have looked. Nobody has to remember they asked.
 */
export async function handOff(text: string, toUserId: string): Promise<R> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  const body = text.trim().slice(0, 500);
  if (!body) return { ok: false, error: "Write something first." };

  // Staff only, and never a school account: a task is a thing JOC owes.
  const to = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true, email: true, schoolId: true, active: true },
  }).catch(() => null);
  if (!to || !to.active || to.schoolId || !isStaffEmail(to.email)) {
    return { ok: false, error: "That isn't somebody you can hand work to." };
  }

  try {
    const made = await prisma.deskTodo.create({
      data: { userId: to.id, assignedById: id, text: body, source: "ASSIGNED" },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't send." };
  }
}

/** Chase it. Only the person who handed it over may. */
export async function nudge(todoId: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.deskTodo.updateMany({
    where: { id: todoId, assignedById: id },
    data: { nudgedAt: new Date() },
  }).catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That isn't yours to chase." };
  done();
  return { ok: true };
}

export async function tickTask(todoId: string, isDone: boolean): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  const row = await prisma.deskTodo.findFirst({
    where: { id: todoId, userId: id },
    select: { id: true, activityId: true },
  }).catch(() => null);
  if (!row) return { ok: false, error: "That isn't on your desk." };

  try {
    await prisma.deskTodo.update({
      where: { id: row.id },
      data: { doneAt: isDone ? new Date() : null },
    });
    // Taken off the Buzz: ticking it here is what "I dealt with it" means.
    if (row.activityId) {
      await prisma.buzzDone.upsert({
        where: { userId_activityId: { userId: id, activityId: row.activityId } },
        create: { userId: id, activityId: row.activityId },
        update: {},
      }).catch(() => null);
      if (!isDone) {
        await prisma.buzzDone.deleteMany({
          where: { userId: id, activityId: row.activityId },
        }).catch(() => null);
      }
    }
    done();
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Today ⇄ Later. */
export async function moveTask(todoId: string, later: boolean): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.deskTodo.updateMany({
    where: { id: todoId, userId: id },
    data: { whenBucket: later ? "LATER" : "TODAY" },
  }).catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That isn't on your desk." };
  done();
  return { ok: true };
}

/** Owner or sender may bin it; nobody else. */
export async function dropTask(todoId: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.deskTodo.deleteMany({
    where: { id: todoId, OR: [{ userId: id }, { assignedById: id }] },
  }).catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That isn't yours to remove." };
  done();
  return { ok: true };
}

/**
 * Mark everything handed to this person as opened.
 *
 * Called once when the desk renders. It is what turns NOT OPENED into SEEN on
 * the sender's side, and it is the only honest version of that signal: not
 * "delivered", but "they have had the page in front of them".
 */
export async function markSeen(): Promise<void> {
  const id = await meId();
  if (!id) return;
  await prisma.deskTodo.updateMany({
    where: { userId: id, seenAt: null, assignedById: { not: null } },
    data: { seenAt: new Date() },
  }).catch(() => null);
}

/* ------------------------------------------------------------- notebook -- */

/**
 * Save the open page, creating it if this is the first thing they've typed.
 *
 * The notebook shows a writable page from the moment the desk loads, with no
 * "new page" step — so the row in the database has to appear on the first
 * keystroke rather than on a button nobody pressed. Returns the id, which
 * the client holds so the next save edits rather than creates.
 */
export async function savePageOrCreate(
  pageId: string | null, title: string, body: string,
): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  if (pageId) {
    const res = await savePage(pageId, title, body);
    return res.ok ? { ok: true, id: pageId } : res;
  }
  try {
    const n = await prisma.notebookPage.count({ where: { userId: id } });
    const made = await prisma.notebookPage.create({
      data: { userId: id, title: title.slice(0, 120), body: body.slice(0, 20000), sort: n },
      select: { id: true },
    });
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function savePage(pageId: string, title: string, body: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.notebookPage.updateMany({
    where: { id: pageId, userId: id },
    data: { title: title.slice(0, 120), body: body.slice(0, 20000) },
  }).catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That page isn't yours." };
  return { ok: true };
}

export async function newPage(title: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  try {
    const n = await prisma.notebookPage.count({ where: { userId: id } });
    const made = await prisma.notebookPage.create({
      data: { userId: id, title: title.trim().slice(0, 120) || "Untitled", sort: n },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function dropPage(pageId: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.notebookPage.deleteMany({ where: { id: pageId, userId: id } })
    .catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That page isn't yours." };
  done();
  return { ok: true };
}

/** A line of the notebook, lifted onto the list. */
export async function pageToTask(text: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const body = text.trim().slice(0, 500);
  if (!body) return { ok: false, error: "Nothing to take." };
  try {
    await prisma.deskTodo.create({ data: { userId: id, text: body, source: "NOTEBOOK" } });
    done();
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/* ----------------------------------------------------------------- tray -- */

/**
 * Clear one thing out of For you.
 *
 * Per person, and nothing else changes: a school's message stays unanswered
 * in the office, it just stops sitting on this desk. Marking it answered for
 * everybody because one person looked at it is how a question gets dropped.
 */
export async function clearFromTray(kind: string, refId: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  if (!["mention", "message", "ask"].includes(kind)) return { ok: false, error: "Unknown item." };
  try {
    await prisma.inTrayCleared.upsert({
      where: { userId_kind_refId: { userId: id, kind, refId } },
      create: { userId: id, kind, refId },
      update: {},
    });
    done();
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/**
 * Take on a task somebody handed you.
 *
 * It is already a row on this desk — unaccepted, so it has been sitting in
 * For you rather than on the list. Accepting moves it across; nothing is
 * created, so the sender keeps watching the same row.
 */
export async function acceptTask(todoId: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.deskTodo.updateMany({
    where: { id: todoId, userId: id, acceptedAt: null },
    data: { acceptedAt: new Date(), declinedAt: null },
  }).catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That isn't waiting for you." };
  done();
  return { ok: true };
}

/**
 * Say no.
 *
 * The row stays, marked, so the person who asked sees DECLINED rather than
 * watching NOT OPENED forever and assuming it is in hand.
 */
export async function declineTask(todoId: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.deskTodo.updateMany({
    where: { id: todoId, userId: id, acceptedAt: null },
    data: { declinedAt: new Date() },
  }).catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That isn't waiting for you." };
  done();
  return { ok: true };
}

/** "Add to my tasks" on a For you card — take it, and clear it. */
export async function trayToTask(kind: string, refId: string, text: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const body = text.trim().slice(0, 500);
  if (!body) return { ok: false, error: "Nothing to take." };
  try {
    await prisma.deskTodo.create({ data: { userId: id, text: body, source: "MINE" } });
    await prisma.inTrayCleared.upsert({
      where: { userId_kind_refId: { userId: id, kind, refId } },
      create: { userId: id, kind, refId },
      update: {},
    }).catch(() => null);
    done();
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/* ----------------------------------------------------------- your day --- */

/**
 * Put something in your own day.
 *
 * The time is stored as the wall clock pinned to UTC and read back the same
 * way, which is the convention the school update form already uses: a 10:30
 * meeting reads 10:30 to whoever looks, rather than sliding by an hour in
 * March and back again in November.
 *
 * `when` is a plain YYYY-MM-DD and `time` an HH:MM or empty for all day.
 */
export async function addDeskEvent(
  title: string, when: string, time: string, note: string,
): Promise<R> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };

  const text = title.trim().slice(0, 200);
  if (!text) return { ok: false, error: "Give it a name first." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(when)) return { ok: false, error: "Pick a date." };
  if (time && !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "That isn't a time." };

  const startsAt = new Date(time ? `${when}T${time}:00.000Z` : `${when}T00:00:00.000Z`);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Pick a date." };

  try {
    const made = await prisma.deskEvent.create({
      data: { userId: id, title: text, note: note.trim().slice(0, 300) || null, startsAt, allDay: !time },
      select: { id: true },
    });
    done();
    return { ok: true, id: made.id };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

/** Take it back out. Yours only — the where clause carries the owner. */
export async function dropDeskEvent(eventId: string): Promise<R> {
  const id = await meId();
  if (!id) return { ok: false, error: "Sign in first." };
  const n = await prisma.deskEvent.deleteMany({ where: { id: eventId, userId: id } })
    .catch(() => ({ count: 0 }));
  if (!n.count) return { ok: false, error: "That isn't in your diary." };
  done();
  return { ok: true };
}
