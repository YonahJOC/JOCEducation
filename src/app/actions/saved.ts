"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Saved lessons.
 *
 * The star on a lesson page used to pop up an alert saying "Sign in to save
 * lessons" even to someone already signed in, and the personal home has a
 * "Your saved lessons" panel that could therefore never fill.
 */

type Result = { ok: true; saved: boolean } | { ok: false; error: string };

export async function toggleSavedLesson(lessonId: number): Promise<Result> {
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sign in to save lessons." };
  if (!isDatabaseConfigured()) return { ok: false, error: "Not connected yet." };

  try {
    const existing = await prisma.savedLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      await prisma.savedLesson.delete({ where: { userId_lessonId: { userId, lessonId } } });
    } else {
      await prisma.savedLesson.create({ data: { userId, lessonId } });
    }

    revalidatePath("/home");
    revalidatePath(`/lesson-plans/${lessonId}`);
    return { ok: true, saved: !existing };
  } catch {
    // The starter lessons have ids that exist in the static file but not in
    // the database, so saving one has nothing to point at.
    return { ok: false, error: "This lesson can't be saved yet." };
  }
}

export async function isLessonSaved(lessonId: number): Promise<boolean> {
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId || !isDatabaseConfigured()) return false;
  try {
    const row = await prisma.savedLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { userId: true },
    });
    return Boolean(row);
  } catch {
    return false;
  }
}
