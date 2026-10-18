"use server";

import { revalidatePath } from "next/cache";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";

/**
 * Put a school on the demo portal, or take it off.
 *
 * The rollout: a school is shown the hallway screen and the people who may
 * sign in to work it, and nothing else, until somebody at JOC decides they
 * are ready for the rest. `School.demoAt` is the whole switch — everything
 * the school can and cannot open is derived from it, so there is no second
 * place to remember.
 *
 * Gated on the `schools` capability, which is the same thing that lets
 * somebody open a school's record at all. Nothing is sent to the school:
 * turning this on changes what they see next time they sign in, and tells
 * them nothing until a person does.
 */

export type DemoResult = { ok: true; demo: boolean } | { ok: false; error: string };

export async function setSchoolDemo(
  _prev: DemoResult | null,
  form: FormData,
): Promise<DemoResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "No database." };

  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) {
    return { ok: false, error: "You cannot change a school's access." };
  }

  const slug = String(form.get("slug") ?? "").trim();
  if (!slug) return { ok: false, error: "Which school?" };

  // "on" means put them on the demo. Anything else takes them off, so a
  // missing checkbox reads as off rather than as an error.
  const on = String(form.get("demo") ?? "") === "on";

  try {
    const school = await prisma.school.update({
      where: { slug },
      data: { demoAt: on ? new Date() : null },
      select: { demoAt: true },
    });

    revalidatePath(`/admin/schools/${slug}`);
    revalidatePath("/admin/schools");
    // Their own rail is built from this, and it is cached per path.
    revalidatePath("/school", "layout");

    return { ok: true, demo: Boolean(school.demoAt) };
  } catch {
    return { ok: false, error: "Could not save that. Try again." };
  }
}
