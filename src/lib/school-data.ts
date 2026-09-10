import { safeAuth } from "@/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { canRunOwnSchool, scopedSchoolId } from "@/lib/access";
import { CYCLES, getCycleState } from "@/lib/cycles";

/**
 * Reads for the school administrator's area.
 *
 * Every query here derives the school from the signed-in user. None of them
 * takes a school id from the caller, so there is no way to read another
 * school's data through this module.
 */

export type SchoolMember = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  lastSeenAt: Date | null;
};

export type SchoolInvite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
};

export type SchoolOverview = {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  accountManager: string | null;
  plan: string | null;
  planStatus: string | null;
  interval: string | null;
  seats: number | null;
  renewsOn: Date | null;
  grantedManually: boolean;
  seatsUsed: number;
  members: SchoolMember[];
  invitations: SchoolInvite[];
};

/** The signed-in school admin's own school, or null. */
export async function mySchool(): Promise<SchoolOverview | null> {
  const session = await safeAuth();
  if (!session?.user || !canRunOwnSchool(session.user)) return null;
  if (!isDatabaseConfigured()) return null;

  const schoolId = scopedSchoolId(session.user);
  if (!schoolId) return null;

  const s = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      subscription: true,
      accountManager: { select: { name: true, email: true } },
      members: {
        select: { id: true, name: true, email: true, role: true, active: true, lastSeenAt: true },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        where: { status: { in: ["PENDING", "EXPIRED"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!s) return null;

  return {
    id: s.id,
    name: s.name,
    city: s.city,
    region: s.region,
    accountManager: s.accountManager?.name ?? s.accountManager?.email ?? null,
    plan: s.subscription?.plan ?? null,
    planStatus: s.subscription?.status ?? null,
    interval: s.subscription?.interval ?? null,
    seats: s.subscription?.seats ?? null,
    renewsOn: s.subscription?.currentPeriodEnd ?? null,
    grantedManually: s.subscription?.grantedManually ?? false,
    seatsUsed: s.members.length,
    members: s.members,
    invitations: s.invitations.map((i) => ({
      id: i.id, email: i.email, role: i.role, status: i.status, expiresAt: i.expiresAt,
    })),
  };
}

export type PlanRequest = {
  id: string;
  message: string;
  status: string;
  response: string | null;
  createdAt: Date;
  respondedAt: Date | null;
};

export async function myPlanRequests(): Promise<PlanRequest[]> {
  const session = await safeAuth();
  if (!session?.user || !canRunOwnSchool(session.user)) return [];
  if (!isDatabaseConfigured()) return [];
  const schoolId = scopedSchoolId(session.user);
  if (!schoolId) return [];

  const rows = await prisma.planChangeRequest.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rows.map((r) => ({
    id: r.id,
    message: r.message,
    status: r.status,
    response: r.response,
    createdAt: r.createdAt,
    respondedAt: r.respondedAt,
  }));
}

/**
 * Cycle progress for this school, against the network median.
 *
 * The comparison never names another school — only the spread — so a school
 * admin can see where they stand without learning anything about anyone else.
 */
export type CycleProgress = {
  slug: string;
  num: number;
  theme: string;
  color: string;
  state: "past" | "current" | "upcoming";
  /** Lessons published for this cycle, network-wide. */
  lessons: number;
  /** How many of this school's teachers have saved a lesson from this cycle. */
  engagedTeachers: number;
  /** Median engaged teachers across all active schools, as a share of staff. */
  networkMedianShare: number;
  ourShare: number;
};

export async function myCycleProgress(): Promise<CycleProgress[] | null> {
  const session = await safeAuth();
  if (!session?.user || !canRunOwnSchool(session.user)) return null;
  if (!isDatabaseConfigured()) return null;
  const schoolId = scopedSchoolId(session.user);
  if (!schoolId) return null;

  const [staffCount, lessonsByCycle, saves] = await Promise.all([
    prisma.user.count({ where: { schoolId } }),
    prisma.lessonPlan.groupBy({
      by: ["cycleSlug"],
      where: { published: true, cycleSlug: { not: null } },
      _count: { _all: true },
    }),
    prisma.savedLesson.findMany({
      where: { user: { schoolId } },
      select: { userId: true, lesson: { select: { cycleSlug: true } } },
    }),
  ]);

  const lessonCount = new Map(lessonsByCycle.map((r) => [r.cycleSlug ?? "", r._count._all]));

  // Distinct teachers per cycle at this school.
  const engaged = new Map<string, Set<string>>();
  for (const s of saves) {
    const slug = s.lesson.cycleSlug;
    if (!slug) continue;
    if (!engaged.has(slug)) engaged.set(slug, new Set());
    engaged.get(slug)!.add(s.userId);
  }

  // Network median share, computed across active schools.
  const networkShares = await networkCycleShares();

  return CYCLES.map((c) => {
    const ours = engaged.get(c.slug)?.size ?? 0;
    return {
      slug: c.slug,
      num: c.num,
      theme: c.theme,
      color: c.color,
      state: getCycleState(c),
      lessons: lessonCount.get(c.slug) ?? 0,
      engagedTeachers: ours,
      ourShare: staffCount > 0 ? ours / staffCount : 0,
      networkMedianShare: networkShares.get(c.slug) ?? 0,
    };
  });
}

/** Median engaged-teacher share per cycle across every active school. */
async function networkCycleShares(): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  try {
    const schools = await prisma.school.findMany({
      where: { subscription: { status: "ACTIVE" } },
      select: {
        id: true,
        _count: { select: { members: true } },
        members: {
          select: { id: true, savedLessons: { select: { lesson: { select: { cycleSlug: true } } } } },
        },
      },
    });

    for (const c of CYCLES) {
      const shares: number[] = [];
      for (const s of schools) {
        const staff = s._count.members;
        if (staff === 0) continue;
        const engaged = s.members.filter((m) =>
          m.savedLessons.some((sl) => sl.lesson.cycleSlug === c.slug)
        ).length;
        shares.push(engaged / staff);
      }
      if (shares.length === 0) { out.set(c.slug, 0); continue; }
      shares.sort((a, b) => a - b);
      const mid = Math.floor(shares.length / 2);
      out.set(
        c.slug,
        shares.length % 2 ? shares[mid] : (shares[mid - 1] + shares[mid]) / 2
      );
    }
  } catch {
    // A missing comparison is better than a broken page.
  }
  return out;
}

/** Recent chesed activity at this school, for the activity screen. */
export async function myActivity() {
  const session = await safeAuth();
  if (!session?.user || !canRunOwnSchool(session.user)) return null;
  if (!isDatabaseConfigured()) return null;
  const schoolId = scopedSchoolId(session.user);
  if (!schoolId) return null;

  const [savedTotal, posts, recentSaves] = await Promise.all([
    prisma.savedLesson.count({ where: { user: { schoolId } } }),
    prisma.boardPost.count({ where: { schoolId, approved: true } }),
    prisma.savedLesson.findMany({
      where: { user: { schoolId } },
      orderBy: { savedAt: "desc" },
      take: 12,
      select: {
        savedAt: true,
        user: { select: { name: true, email: true } },
        lesson: { select: { title: true, grade: true, cycleSlug: true } },
      },
    }),
  ]);

  return {
    savedTotal,
    boardPosts: posts,
    recent: recentSaves.map((s) => ({
      when: s.savedAt,
      who: s.user.name ?? s.user.email,
      lesson: s.lesson.title,
      grade: s.lesson.grade,
      cycleSlug: s.lesson.cycleSlug,
    })),
  };
}
