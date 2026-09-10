import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeAuth, isAuthConfigured } from "@/auth";
import { hasSiteAccess } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { PersonalHome, cyclesStartedSince, type HomeData } from "@/components/sections/PersonalHome";

export const metadata: Metadata = {
  title: "JOC Education",
  robots: { index: false, follow: false },
};

/**
 * Signed in, this is a personal home: the running Cycle, what is new, saved
 * lessons, and a read-only view of their school.
 *
 * Signed out — only possible while the gate is off, before sign-in is
 * configured — it sends them to the public landing page.
 */
export default async function HomePage() {
  const session = isAuthConfigured ? await safeAuth() : null;

  if (isAuthConfigured) {
    if (!session?.user) redirect("/");
    // An administrator-issued password has been seen by someone else.
    if (session.user.mustChangePassword) redirect("/account/password?forced=1");
    if (!hasSiteAccess(session.user)) redirect("/no-access");
    return <PersonalHome data={await loadHome(session.user)} />;
  }

  // Only reachable before sign-in is configured. The landing page at "/" is
  // public and is the marketing site, so send them there rather than keeping
  // a second copy of it here.
  redirect("/");
}

type SessionUser = {
  id: string; name?: string | null; email?: string | null;
  role: string; schoolId: string | null; isStaff: boolean;
};

async function loadHome(user: SessionUser): Promise<HomeData> {
  const firstName = user.name?.trim().split(/\s+/)[0] ?? null;

  const base: HomeData = {
    firstName,
    isStaff: user.isStaff,
    role: user.role,
    schoolName: null,
    schoolAdmins: [],
    savedLessons: [],
    newSinceLastVisit: [],
  };

  if (!isDatabaseConfigured()) return base;

  try {
    const [me, saved] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          lastSeenAt: true,
          school: {
            select: {
              name: true,
              members: {
                where: { role: "SCHOOL_ADMIN" },
                select: { name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.savedLesson.findMany({
        where: { userId: user.id },
        orderBy: { savedAt: "desc" },
        take: 5,
        select: { lesson: { select: { id: true, title: true, grade: true, cycleSlug: true } } },
      }),
    ]);

    base.schoolName = me?.school?.name ?? null;
    base.schoolAdmins = me?.school?.members ?? [];
    base.savedLessons = saved.map((s) => ({
      id: s.lesson.id,
      title: s.lesson.title,
      grade: s.lesson.grade,
      cycleSlug: s.lesson.cycleSlug,
    }));

    // Lessons and resources published since they were last here.
    const since = me?.lastSeenAt ?? null;
    if (since) {
      const [lessons, resources] = await Promise.all([
        prisma.lessonPlan.findMany({
          where: { published: true, updatedAt: { gt: since } },
          orderBy: { updatedAt: "desc" },
          take: 4,
          select: { title: true, updatedAt: true },
        }),
        prisma.resource.findMany({
          where: { published: true, updatedAt: { gt: since } },
          orderBy: { updatedAt: "desc" },
          take: 3,
          select: { title: true, tag: true, updatedAt: true },
        }),
      ]);
      base.newSinceLastVisit = [
        ...lessons.map((l) => ({ title: l.title, kind: "New lesson plan", when: l.updatedAt })),
        ...resources.map((r) => ({ title: r.title, kind: `New ${r.tag.toLowerCase()}`, when: r.updatedAt })),
        ...cyclesStartedSince(since).map((c) => ({
          title: `${c.theme} began`,
          kind: `Cycle ${c.num} · ${c.hebrew}`,
          when: new Date(c.startDate),
        })),
      ]
        .sort((a, b) => b.when.getTime() - a.when.getTime())
        .slice(0, 6);
    }
  } catch {
    // A personal home that is a little empty beats a page that will not load.
  }

  return base;
}
