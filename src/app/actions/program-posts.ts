"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * Writing what every school on a program reads.
 *
 * Three kinds behind one table: what's new, the questions schools keep
 * asking, and the things to open or download. A coordinator who runs the
 * program may write them; nobody else may.
 *
 * Everything starts unpublished. A draft on thirty-nine school portals is
 * worse than no draft, so publishing is a second, deliberate press.
 */

export type PostResult = { ok: true } | { ok: false; error: string };

type Kind = "UPDATE" | "QA" | "RESOURCE";

async function mayWrite(programId: number): Promise<boolean> {
  if (openForReview) return true;
  const session = await safeAuth();
  if (can(session?.user, "programs")) return true;

  // Or they are down as running this one.
  const id = session?.user?.id;
  if (!id) return false;
  const lead = await prisma.programPage.count({
    where: { id: programId, leads: { some: { id } } },
  });
  return lead > 0;
}

export async function savePost(
  programId: number,
  kind: Kind,
  _prev: PostResult | null,
  form: FormData,
): Promise<PostResult> {
  if (!(await mayWrite(programId))) return { ok: false, error: "That isn't yours to write." };
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();

  if (!title) {
    return {
      ok: false,
      error: kind === "QA" ? "Write the question." : "Give it a heading.",
    };
  }
  if (kind === "RESOURCE" && !url) {
    return { ok: false, error: "A resource needs a link, or there is nothing to open." };
  }
  if (kind !== "RESOURCE" && !body) {
    return { ok: false, error: kind === "QA" ? "Write the answer." : "Write the note." };
  }

  try {
    await prisma.programPost.create({
      data: {
        programId,
        kind,
        title: title.slice(0, 200),
        body: body.slice(0, 4000),
        url: url ? url.slice(0, 500) : undefined,
        authorId: (await safeAuth())?.user?.id ?? undefined,
      },
    });
    revalidatePath("/admin/programs");
    revalidatePath("/school/programs");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save. Try again in a moment." };
  }
}

/** Publishing, and taking it back down. */
export async function setPostPublished(
  programId: number,
  postId: string,
  published: boolean,
): Promise<PostResult> {
  if (!(await mayWrite(programId))) return { ok: false, error: "That isn't yours to change." };
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  try {
    await prisma.programPost.updateMany({
      where: { id: postId, programId },
      data: { published, publishedAt: published ? new Date() : null },
    });
    revalidatePath("/admin/programs");
    revalidatePath("/school/programs");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't save." };
  }
}

export async function deletePost(programId: number, postId: string): Promise<PostResult> {
  if (!(await mayWrite(programId))) return { ok: false, error: "That isn't yours to delete." };
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  try {
    await prisma.programPost.deleteMany({ where: { id: postId, programId } });
    revalidatePath("/admin/programs");
    revalidatePath("/school/programs");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't delete." };
  }
}
