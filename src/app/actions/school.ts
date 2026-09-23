"use server";

import { revalidatePath } from "next/cache";
import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canRunOwnSchool, scopedSchoolId } from "@/lib/access";

/**
 * Actions for a school administrator, running their own school.
 *
 * Every one of these derives the school from the signed-in user. None of them
 * accepts a school id from the caller, so there is no request a school admin
 * can construct that reaches another school's data.
 */

type Result = { ok: true } | { ok: false; error: string };

/** Returns the caller's own school id, or throws. */
async function ownSchool(): Promise<{ userId: string; schoolId: string }> {
  const session = await safeAuth();
  const user = session?.user;
  if (!user) throw new Error("Sign in first");
  if (!isDatabaseConfigured()) throw new Error("Database not connected");
  if (!canRunOwnSchool(user)) throw new Error("You do not administer a school");
  const schoolId = scopedSchoolId(user);
  if (!schoolId) throw new Error("Your account is not attached to a school");
  return { userId: user.id, schoolId };
}

/**
 * Add a teacher to this school.
 *
 * Adding, not inviting. The old version wrote an invitation and emailed a
 * link — and since nothing may reach a school before JOC launches, the email
 * was held and the school admin was shown an error, while a pending
 * invitation nobody would ever receive sat on the system. Broken twice: it
 * looked like it had failed, and it had half worked.
 *
 * The account is simply created. They sign in with that address. The school
 * admin tells them, which they were going to do anyway.
 */
export async function addTeacher(
  name: string,
  email: string,
  role: "TEACHER" | "SCHOOL_ADMIN",
): Promise<Result> {
  try {
    const { schoolId } = await ownSchool();
    const clean = email.trim().toLowerCase();
    const person = name.trim();
    if (!person) return { ok: false, error: "Give their name." };
    if (!/^[^s@]+@[^s@]+.[^s@]{2,}$/.test(clean)) {
      return { ok: false, error: "That does not look like an email address." };
    }

    // Seat limit is the school's, and it is theirs to respect.
    const [sub, used] = await Promise.all([
      prisma.subscription.findUnique({ where: { schoolId }, select: { seats: true } }),
      prisma.user.count({ where: { schoolId } }),
    ]);
    if (sub?.seats && used >= sub.seats) {
      return { ok: false, error: `All ${sub.seats} seats are taken. Ask JOC for more.` };
    }

    const existing = await prisma.user.findUnique({
      where: { email: clean },
      select: { id: true, schoolId: true, name: true },
    });

    if (existing) {
      if (existing.schoolId === schoolId) return { ok: false, error: "They are already on your team." };
      if (existing.schoolId) {
        return { ok: false, error: `${existing.name ?? clean} is already at another school. JOC can move them.` };
      }
      // On the system but at no school — join them to this one, keeping the
      // name and role they already have.
      await prisma.user.update({ where: { id: existing.id }, data: { schoolId } });
      revalidatePath("/school/teachers");
      return { ok: true };
    }

    await prisma.user.create({
      data: { email: clean, name: person, role: role as never, schoolId },
    });

    revalidatePath("/school/teachers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function cancelInvitation(invitationId: string): Promise<Result> {
  try {
    const { schoolId } = await ownSchool();
    // Scoped delete — an id from another school simply matches nothing.
    const res = await prisma.invitation.updateMany({
      where: { id: invitationId, schoolId },
      data: { status: "REVOKED" },
    });
    if (res.count === 0) return { ok: false, error: "That invitation is not yours" };
    revalidatePath("/school/teachers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Remove a teacher from this school. The account survives; the link does not. */
export async function removeTeacher(userId: string): Promise<Result> {
  try {
    const { userId: me, schoolId } = await ownSchool();
    if (userId === me) return { ok: false, error: "You cannot remove yourself" };

    const res = await prisma.user.updateMany({
      where: { id: userId, schoolId },
      data: { schoolId: null, role: "TEACHER" },
    });
    if (res.count === 0) return { ok: false, error: "That person is not at your school" };
    revalidatePath("/school/teachers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/** Promote a colleague to co-administer the school, or step them back down. */
export async function setTeacherRole(
  userId: string,
  role: "TEACHER" | "SCHOOL_ADMIN"
): Promise<Result> {
  try {
    const { userId: me, schoolId } = await ownSchool();
    if (userId === me) return { ok: false, error: "You cannot change your own role" };

    const res = await prisma.user.updateMany({
      where: { id: userId, schoolId, role: { in: ["TEACHER", "SCHOOL_ADMIN"] } },
      data: { role: role as never },
    });
    if (res.count === 0) return { ok: false, error: "That person is not at your school" };
    revalidatePath("/school/teachers");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Ask JOC to change the plan or add seats.
 *
 * Deliberately a request. Nothing is charged and nothing changes until
 * somebody at JOC acts on it.
 */
export async function requestPlanChange(input: {
  message: string;
  wantsSeats?: number;
}): Promise<Result> {
  try {
    const { userId, schoolId } = await ownSchool();
    const message = input.message.trim();
    if (!message) return { ok: false, error: "Tell us what you need" };

    await prisma.planChangeRequest.create({
      data: {
        schoolId,
        message,
        wantsSeats: input.wantsSeats && input.wantsSeats > 0 ? input.wantsSeats : null,
        requestedById: userId,
      },
    });

    // Put it on the school's timeline so JOC sees it in the console.
    await prisma.schoolActivity.create({
      data: {
        schoolId,
        type: "NOTE",
        summary: "Plan change requested by the school",
        detail: message,
        authorId: userId,
      },
    });

    revalidatePath("/school/plan");
    revalidatePath("/admin/schools");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
