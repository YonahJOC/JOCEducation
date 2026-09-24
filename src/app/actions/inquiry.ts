"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { currentSchoolId } from "@/lib/school-scope";

/**
 * A school asking for something it does not have yet.
 *
 * The only thing that travels from a school to JOC, and it travels by being
 * written down. Nothing is sent to the school, and the answer happens outside
 * the portal — a coordinator reads it on their console and picks up the
 * phone, which is how every other action in here works.
 *
 * One open ask per school per thing, so pressing the button twice does not
 * file twice and does not start a second conversation about the same subject.
 */

export async function askFor(kind: string, programId?: number | null): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const schoolId = await currentSchoolId();
  if (!schoolId) return;

  const session = await safeAuth();

  try {
    await prisma.inquiry.create({
      data: {
        schoolId,
        kind,
        programId: programId ?? null,
        askedById: session?.user?.id ?? null,
      },
    });
  } catch {
    // The unique index on (school, kind, status) is the whole point: a second
    // press while one is open is not an error, it is the same ask.
  }

  revalidatePath("/", "layout");
}
