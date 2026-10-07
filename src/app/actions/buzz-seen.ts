"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";

/**
 * This person has now read this thread.
 *
 * Written when they open it, not when the page loads — opening it is the
 * only thing that means they saw what was in it.
 *
 * No revalidate: the dot has already gone on their screen, and re-rendering
 * the whole feed to agree with something they just did would throw away the
 * scroll position they are reading from.
 */
export async function markThreadSeen(activityId: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const session = await safeAuth();
  const id = session?.user?.id;
  if (!id) return;

  try {
    await prisma.buzzSeen.upsert({
      where: { userId_activityId: { userId: id, activityId } },
      create: { userId: id, activityId, seenAt: new Date() },
      update: { seenAt: new Date() },
    });
  } catch {
    // A dot that fails to clear is a nuisance; a page that throws over one
    // is worse.
  }
}

/**
 * Put the dot back, for this person only.
 *
 * The thing somebody does when they have read a note and cannot deal with it
 * now. Without it the only way to keep a note in front of you is to leave it
 * unopened, which means not reading it.
 */
export async function markThreadUnread(activityId: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const session = await safeAuth();
  const id = session?.user?.id;
  if (!id) return;

  try {
    await prisma.buzzSeen.deleteMany({ where: { userId: id, activityId } });
  } catch {
    // As above.
  }
}
