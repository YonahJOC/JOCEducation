"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";

/**
 * A thumbs up, on or off.
 *
 * Anybody who can open the Buzz can leave one — the page itself is the gate,
 * and there is nothing here worth a second check: the worst a stray call can
 * do is add a number to a row the caller can already read.
 *
 * No revalidate. The count has already moved on their screen, and
 * re-rendering forty items to agree would throw away where they were
 * reading.
 */
export async function toggleLike(activityId: string, on: boolean): Promise<{ ok: boolean }> {
  if (!isDatabaseConfigured()) return { ok: false };
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  try {
    if (on) {
      await prisma.buzzLike.upsert({
        where: { userId_activityId: { userId, activityId } },
        create: { userId, activityId },
        update: {},
      });
    } else {
      await prisma.buzzLike.deleteMany({ where: { userId, activityId } });
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
