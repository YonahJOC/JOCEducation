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

export async function viewAsSchool(slug: string): Promise<void> {
  if (!(await mayLookIn())) redirect("/admin");
  if (!isDatabaseConfigured()) redirect("/admin/schools");

  const school = await prisma.school.findUnique({ where: { slug }, select: { slug: true } });
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
