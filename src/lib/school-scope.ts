import { safeAuth, openForReview } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { scopedSchoolId } from "@/lib/access";

/**
 * Which school this request is for.
 *
 * Every read on the school side derives its school from the signed-in user
 * and never from anything the caller passes, so there is no way to reach
 * another school's data through it. This is that question asked in one place.
 *
 * The one addition is review mode. `openForReview` is already how the console
 * opens when no auth is configured outside production — but it gave a console
 * session and no school, so `/school` and `/home` could be built and never
 * looked at. That is exactly how a redesign ships that nobody has seen. Here
 * it resolves to the test school instead, through the same flag and the same
 * gate, so the school side can be checked the way the console can.
 *
 * It cannot do anything in production: `openForReview` is
 * `!isAuthConfigured && NODE_ENV !== "production"`.
 */

/** The school whose data this request may read, or null. */
export async function currentSchoolId(): Promise<string | null> {
  const session = await safeAuth();
  const own = scopedSchoolId(session?.user);
  if (own) return own;

  if (!openForReview || !isDatabaseConfigured()) return null;
  return reviewSchoolId();
}

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

/** True when the school being shown is a stand-in rather than the reader's. */
export async function isReviewingSchool(): Promise<boolean> {
  if (!openForReview) return false;
  const session = await safeAuth();
  return !scopedSchoolId(session?.user);
}
