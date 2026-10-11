import { safeAuth, openForReview } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { can, canRunOwnSchool, canRunSchoolApp } from "@/lib/access";

/**
 * Who may do what to a school's screen.
 *
 *   staff       anybody at JOC who looks after schools. Every school's
 *               screen, everything on it, and approves.
 *   teacher     the school's account holder or app admin — the same people
 *               who already look after that school's ambassadors. Their own
 *               school, everything on it, and approves.
 *   ambassador  a student with a live ambassadorship at that school. Adds
 *               flyers and photos; nothing they add reaches the wall until a
 *               teacher or JOC approves it, and they cannot approve.
 *
 * No new roles: each of these is a fact the app already keeps.
 */

export type ScreenRole = "staff" | "teacher" | "ambassador";

export type ScreenActor = { userId: string | null; email: string | null; role: ScreenRole };

type SessionUser = NonNullable<Awaited<ReturnType<typeof safeAuth>>>["user"];

export function canApprove(role: ScreenRole | null | undefined): boolean {
  return role === "staff" || role === "teacher";
}

export function isScreenStaff(user: SessionUser | null | undefined): boolean {
  if (openForReview) return true;
  return Boolean(user && can(user, "schools"));
}

/** This person's part in this school's screen, or null if they have none. */
export async function screenRoleFor(
  user: SessionUser | null | undefined, schoolId: string,
): Promise<ScreenRole | null> {
  if (isScreenStaff(user)) return "staff";
  if (!user?.id) return null;

  if (user.schoolId === schoolId && (canRunOwnSchool(user) || canRunSchoolApp(user))) return "teacher";

  if (!isDatabaseConfigured()) return null;
  const now = new Date();
  const amb = await prisma.programAmbassador.findFirst({
    where: {
      userId: user.id, schoolId,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    select: { id: true },
  }).catch(() => null);
  return amb ? "ambassador" : null;
}

/** The signed-in person and their part in this school's screen. */
export async function screenActor(schoolId: string): Promise<ScreenActor | null> {
  const session = await safeAuth();
  const user = session?.user;
  const role = await screenRoleFor(user, schoolId);
  if (!role) return null;
  return { userId: user?.id ?? null, email: user?.email ?? null, role };
}

/**
 * The one school a non-staff person's screen page is about: a teacher's own,
 * or the school they are an ambassador at.
 */
export async function myScreenSchool(): Promise<{ id: string; slug: string; name: string; role: ScreenRole } | null> {
  if (!isDatabaseConfigured()) return null;
  const session = await safeAuth();
  const user = session?.user;
  if (!user?.id) return null;

  if (user.schoolId && (canRunOwnSchool(user) || canRunSchoolApp(user))) {
    const s = await prisma.school.findUnique({
      where: { id: user.schoolId }, select: { id: true, slug: true, name: true },
    }).catch(() => null);
    if (s) return { ...s, role: "teacher" };
  }

  const now = new Date();
  const amb = await prisma.programAmbassador.findFirst({
    where: { userId: user.id, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: { startsAt: "desc" },
    select: { school: { select: { id: true, slug: true, name: true } } },
  }).catch(() => null);
  return amb ? { ...amb.school, role: "ambassador" } : null;
}
