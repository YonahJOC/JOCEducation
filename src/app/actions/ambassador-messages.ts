"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { markThreadSeen } from "@/lib/ambassador-messages";

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

/** Both ends of a thread, or a refusal to hand straight back. */
async function sideOf(ambassadorId: string): Promise<Side> {
  if (!isDatabaseConfigured()) return { error: "The database is not connected." };
  const session = await safeAuth();
  const me = session?.user?.id;
  if (!me) return { error: "Sign in first." };

  const amb = await prisma.programAmbassador.findUnique({
    where: { id: ambassadorId },
    select: { id: true, userId: true, supervisorId: true, endsAt: true },
  }).catch(() => null);
  if (!amb) return { error: "That ambassadorship has gone." };

  // A finished tenure is read-only on both sides. What was written stays;
  // nothing new is added to a conversation that has ended.
  if (amb.endsAt && amb.endsAt <= new Date()) {
    return { error: "This one has finished. You can read it, but not add to it." };
  }

  if (amb.userId === me) return { ambassadorId: amb.id, fromStudent: true as const, userId: me };
  if (amb.supervisorId === me) return { ambassadorId: amb.id, fromStudent: false as const, userId: me };
  return { error: "This conversation is not yours." };
}

export async function sendAmbassadorMessage(ambassadorId: string, body: string): Promise<R> {
  const side = await sideOf(ambassadorId);
  if ("error" in side) return { ok: false, error: side.error };

  const text = (body ?? "").trim().slice(0, MAX);
  if (text.length < 2) return { ok: false, error: "Write something first." };

  await prisma.ambassadorMessage.create({
    data: {
      ambassadorId: side.ambassadorId,
      // The only audience anything writes. See src/lib/ambassador-messages.ts.
      audience: "TEACHER",
      body: text,
      fromStudent: side.fromStudent,
      authorId: side.userId,
    },
  }).catch(() => null);

  revalidatePath("/ambassador/messages");
  revalidatePath("/school/ambassadors");
  return { ok: true };
}

/** Opening the thread is what "they have seen it" means. */
export async function seenAmbassadorMessages(ambassadorId: string): Promise<R> {
  const side = await sideOf(ambassadorId);
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
  if (!amb || (amb.userId !== me && amb.supervisorId !== me)) {
    return { ok: false, error: "This conversation is not yours." };
  }

  await markThreadSeen(ambassadorId, amb.userId === me);
  return { ok: true };
}
