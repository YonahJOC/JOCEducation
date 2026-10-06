"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool, can } from "@/lib/access";
import { currentSchoolId } from "@/lib/school-scope";

/**
 * A school sending JOC its list of students.
 *
 * The file holds minors' names, so it goes into StoredFile like every other
 * upload and is only ever served back through /api/files/[id], which checks
 * who is asking. Nothing here renders a single row of it, on either side.
 *
 * Uploading sets the state to UPLOADED, which is the school saying "here it
 * is" rather than JOC saying "this works" — whether it is usable is still
 * JOC's call, made on the board.
 */

export type ListResult = { ok: true } | { ok: false; error: string };

/** The size the rest of the portal allows. */
const LIMIT = 10 * 1024 * 1024;

export async function uploadStudentList(
  _prev: ListResult | null,
  form: FormData,
): Promise<ListResult> {
  const schoolId = await currentSchoolId();
  if (!schoolId || !isDatabaseConfigured()) {
    return { ok: false, error: "Your account is not attached to a school yet." };
  }

  const session = await safeAuth();
  // Only whoever runs the account. A teacher who runs the app has no business
  // sending the school's student list.
  if (!openForReview && !canRunOwnSchool(session?.user) && !can(session?.user, "schools")) {
    return { ok: false, error: "Only whoever runs the account can send this." };
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pick a file first." };
  }
  if (file.size > LIMIT) {
    return { ok: false, error: "That file is bigger than 10MB. Send a smaller one." };
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());

    await prisma.$transaction(async (tx) => {
      const stored = await tx.storedFile.create({
        data: {
          name: file.name.slice(0, 200),
          mimeType: file.type || "application/octet-stream",
          size: bytes.length,
          data: bytes,
          uploadedById: session?.user?.id ?? undefined,
        },
        select: { id: true },
      });

      await tx.studentListFile.create({
        data: {
          schoolId,
          fileId: stored.id,
          uploadedById: session?.user?.id ?? undefined,
          fromSchool: true,
        },
      });

      await tx.school.update({
        where: { id: schoolId },
        data: {
          studentListState: "UPLOADED",
          studentListNote: null,
          studentListAt: new Date(),
        },
      });

      // So it shows on the school's own history and on the board's Note
      // column, without anybody having to go looking for the upload.
      const who = session?.user?.name ?? session?.user?.email ?? "Somebody at the school";
      await tx.schoolActivity.create({
        data: {
          schoolId,
          type: "NOTE",
          inbound: true,
          summary: `${who} sent a new student list`,
          detail: file.name.slice(0, 200),
        },
      });
    });

    revalidatePath("/school");
    revalidatePath("/admin/schools/board");
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't upload. Try again in a moment." };
  }
}
