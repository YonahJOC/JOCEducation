"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * What teachers do on the Teachers' Board.
 *
 * Posting requires an account — the board is teachers talking to teachers,
 * and an anonymous form is an invitation to spam. Nothing appears publicly
 * until the education team approves it in the console.
 */

type Result = { ok: true } | { ok: false; error: string };

export async function submitBoardPost(input: {
  title: string;
  body: string;
  region: string;
  schoolName: string;
  grade: "es" | "ms" | "hs";
}): Promise<Result> {
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sign in to post to the board." };
  if (!isDatabaseConfigured()) return { ok: false, error: "The board is not connected yet." };

  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 4) return { ok: false, error: "Give your idea a title." };
  if (body.length < 20) return { ok: false, error: "Say a little more about what you ran." };

  // Their own school, when we know it, rather than whatever they typed.
  let schoolName = input.schoolName.trim();
  let schoolId: string | null = null;
  if (session.user.schoolId) {
    try {
      const s = await prisma.school.findUnique({
        where: { id: session.user.schoolId },
        select: { id: true, name: true },
      });
      if (s) { schoolId = s.id; schoolName = s.name; }
    } catch {
      // Fall back to what they typed.
    }
  }

  try {
    await prisma.boardPost.create({
      data: {
        userId,
        title: title.slice(0, 140),
        body: body.slice(0, 4000),
        grade: input.grade,
        region: input.region.trim().slice(0, 60) || "Not given",
        schoolName: schoolName.slice(0, 120) || "A JOC school",
        schoolId,
        approved: false,
      },
    });
  } catch {
    return { ok: false, error: "Could not post that. Please try again." };
  }

  revalidatePath("/board");
  revalidatePath("/admin/board");
  return { ok: true };
}

/** One like per person per post, so the count means something. */
export async function toggleBoardLike(postId: string): Promise<Result> {
  const session = await safeAuth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sign in to mark an idea useful." };
  if (!isDatabaseConfigured()) return { ok: false, error: "The board is not connected yet." };

  try {
    const existing = await prisma.boardLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.boardLike.delete({ where: { userId_postId: { userId, postId } } }),
        prisma.boardPost.update({ where: { id: postId }, data: { likes: { decrement: 1 } } }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.boardLike.create({ data: { userId, postId } }),
        prisma.boardPost.update({ where: { id: postId }, data: { likes: { increment: 1 } } }),
      ]);
    }
  } catch {
    return { ok: false, error: "Could not save that." };
  }

  revalidatePath("/board");
  return { ok: true };
}
