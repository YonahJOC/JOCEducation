import { cookies } from "next/headers";
import { safeAuth, openForReview } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { scopedSchoolId, can } from "@/lib/access";

/**
 * Which school this request is for.
 *
 * Every read on the school side derives its school from the signed-in user
 * and never from anything the caller passes, so there is no way to reach
 * another school's data through it. This is that question asked in one place.
 *
 * Two things sit on top of it.
 *
 * **Review mode.** `openForReview` already opens the console when no auth is
 * configured outside production. It gave a console session and no school, so
 * `/school` and `/home` could be built and never looked at — which is how a
 * redesign ships that nobody has seen. Here it resolves to the test school.
 *
 * **Looking at a school's own panel.** Somebody who may already read every
 * school's record can open the panel that school sees, which is the only way
 * to answer "what does this actually look like for them". It is gated on the
 * `schools` capability, it is announced on every page while it is on, and it
 * is a cookie rather than a query string so it survives a click without
 * trailing through every link. A school user can never set it: the override
 * is only consulted for somebody who holds the capability.
 */

const AS_SCHOOL = "joc-as-school";

/** The school whose data this request may read, or null. */
export async function currentSchoolId(): Promise<string | null> {
  const viewing = await viewingAs();
  if (viewing) return viewing.id;

  const session = await safeAuth();
  const own = scopedSchoolId(session?.user);
  if (own) return own;

  if (!openForReview || !isDatabaseConfigured()) return null;
  return reviewSchoolId();
}

/**
 * The school somebody is looking in on, when they are.
 *
 * Returns null for everybody else, including anyone without the capability,
 * so a stale cookie on a teacher's browser does nothing at all.
 */
export async function viewingAs(): Promise<{ id: string; name: string } | null> {
  if (!isDatabaseConfigured()) return null;

  const jar = await cookies();
  const slug = jar.get(AS_SCHOOL)?.value;
  if (!slug) return null;

  const session = await safeAuth();
  if (!openForReview && !can(session?.user, "schools")) return null;

  const school = await prisma.school.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  return school ?? null;
}

/** The cookie's name, for the action that sets and clears it. */
export const AS_SCHOOL_COOKIE = AS_SCHOOL;

/**
 * The school review mode stands in for.
 *
 * The test school by preference, because it is the one with every field and
 * every report filled in; otherwise whichever school has the most going on,
 * so the panels have something to show.
 */
let cached: string | null | undefined;

async function reviewSchoolId(): Promise<string | null> {
  if (cached !== undefined) return cached;

  const test = await prisma.school.findUnique({
    where: { slug: "joc-test-school" },
    select: { id: true },
  });

  if (test) {
    cached = test.id;
    return cached;
  }

  const any = await prisma.school.findFirst({
    orderBy: { enrollments: { _count: "desc" } },
    select: { id: true },
  });

  cached = any?.id ?? null;
  return cached;
}
