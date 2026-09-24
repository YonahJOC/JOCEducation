"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { AS_SCHOOL_COOKIE } from "@/lib/school-scope";

/**
 * Look in on a school's own panel, and stop.
 *
 * Only for somebody who may already read every school's record — the same
 * capability that opens the school's page in the console. It reads; it writes
 * nothing to the school, and it sends nothing anywhere.
 */

async function mayLookIn(): Promise<boolean> {
  if (openForReview) return true;
  const session = await safeAuth();
  return can(session?.user, "schools");
}

/**
 * @param ref Either a school's id or its slug.
 *
 * Both, because the two places this is called from hold different things. The
 * console's school page is routed by id — its parameter is *named* slug and
 * is not one — while the switcher on the school side has the slug. Looking up
 * only one of them is why the button on the school page silently did nothing:
 * findUnique on slug was handed an id, found no school, and redirected
 * straight back to the list it came from.
 */
export async function viewAsSchool(ref: string): Promise<void> {
  if (!(await mayLookIn())) redirect("/admin");
  if (!isDatabaseConfigured()) redirect("/admin/schools");

  const school = await prisma.school.findFirst({
    where: { OR: [{ id: ref }, { slug: ref }] },
    select: { slug: true },
  });
  if (!school) redirect("/admin/schools");

  const jar = await cookies();
  jar.set(AS_SCHOOL_COOKIE, school.slug, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // The session, not longer. Looking in on a school is a thing you do and
    // then finish, not a state to wake up in tomorrow.
    maxAge: 60 * 60 * 4,
  });

  redirect("/school");
}

export async function stopViewingAsSchool(): Promise<void> {
  const jar = await cookies();
  jar.delete(AS_SCHOOL_COOKIE);
  redirect("/admin/schools");
}
