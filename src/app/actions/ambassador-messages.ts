"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { markThreadSeen, type Audience } from "@/lib/ambassador-messages";
import { can } from "@/lib/access";

/**
 * Writing between a student ambassador and their teacher.
 *
 * Who may write to whom is worked out here from the session and the
 * ambassadorship row, never from anything the form says. There are exactly
 * two people on a thread: the student it belongs to, and the teacher who
 * supervises them.
 */

type R = { ok: true } | { ok: false; error: string };

const MAX = 1500;

/** Which end of a thread this person is, or why they are on neither. */
type Side =
  | { ambassadorId: string; fromStudent: boolean; userId: string }
  | { error: string };

const FINISHED = "This one has finished. You can read it, but not add to it.";

/**
 * Both ends of a thread, or a refusal to hand straight back.
 *
 * Who the other end is depends on the audience. For TEACHER it is the one
 * adult who supervises this student. For JOC it is anybody at JOC who
 * reads the messages — a student writes to the organisation, not to a
 * person, so whoever is around answers.
 */
async function sideOf(ambassadorId: string, audience: Audience): Promise<Side> {
  if (!isDatabaseConfigured()) return { error: "The database is not connected." };
  const session = await safeAuth();
  const me = session?.user?.id;
  if (!me) return { error: "Sign in first." };

  const amb = await prisma.programAmbassador.findUnique({
    where: { id: ambassadorId },
    select: { id: true, userId: true, supervisorId: true, endsAt: true },
  }).catch(() => null);
  if (!amb) return { error: "That ambassadorship has gone." };

  // A finished tenure is read-only on every side. What was written stays;
  // nothing new is added to a conversation that has ended.
  if (amb.endsAt && amb.endsAt <= new Date()) return { error: FINISHED };

  if (amb.userId === me) return { ambassadorId: amb.id, fromStudent: true, userId: me };

  if (audience === "JOC") {
    // The same permission that reads what schools write in.
    const reads = can(session?.user, "messages") || can(session?.user, "schools");
    if (reads) return { ambassadorId: amb.id, fromStudent: false, userId: me };
    return { error: "This conversation is not yours." };
  }

  if (amb.supervisorId === me) return { ambassadorId: amb.id, fromStudent: false, userId: me };
  return { error: "This conversation is not yours." };
}

export async function sendAmbassadorMessage(
  ambassadorId: string,
  body: string,
  audience: Audience = "TEACHER",
): Promise<R> {
  const side = await sideOf(ambassadorId, audience);
  if ("error" in side) return { ok: false, error: side.error };

  const text = (body ?? "").trim().slice(0, MAX);
  if (text.length < 2) return { ok: false, error: "Write something first." };

  /**
   * Not swallowed.
   *
   * This used to be `.catch(() => null)` and then return ok, so a write
   * that failed looked exactly like a write that worked: the box cleared,
   * nothing appeared, and nobody found out until the person on the other
   * end never answered. A message that silently vanishes is worse than an
   * error — it costs somebody their trust in the thing rather than two
   * minutes of their time.
   */
  try {
    await prisma.ambassadorMessage.create({
      data: {
        ambassadorId: side.ambassadorId,
        audience,
        body: text,
        fromStudent: side.fromStudent,
        // Always somebody's, even on the JOC side: a student writes to the
        // organisation, and the answer still comes from a person with a name.
        authorId: side.userId,
      },
    });
  } catch {
    return { ok: false, error: "That didn't send. Try again in a moment." };
  }

  revalidatePath("/ambassador/messages");
  revalidatePath("/school/ambassadors");
  revalidatePath("/admin/messages");
  return { ok: true };
}

/** Opening the thread is what "they have seen it" means. */
export async function seenAmbassadorMessages(
  ambassadorId: string,
  audience: Audience = "TEACHER",
): Promise<R> {
  const side = await sideOf(ambassadorId, audience);
  // A finished tenure can still be read, and reading it still counts.
  if ("error" in side && side.error !== FINISHED) {
    return { ok: false, error: side.error };
  }

  const session = await safeAuth();
  const me = session?.user?.id;
  if (!me) return { ok: false, error: "Sign in first." };

  const amb = await prisma.programAmbassador.findUnique({
    where: { id: ambassadorId },
    select: { userId: true, supervisorId: true },
  }).catch(() => null);
  if (!amb) return { ok: false, error: "This conversation is not yours." };

  const student = amb.userId === me;
  const reads =
    student ||
    (audience === "JOC"
      ? can(session?.user, "messages") || can(session?.user, "schools")
      : amb.supervisorId === me);
  if (!reads) return { ok: false, error: "This conversation is not yours." };

  await markThreadSeen(ambassadorId, student, audience);
  return { ok: true };
}
