import { prisma, isDatabaseConfigured } from "@/lib/prisma";

/**
 * Reading the programming calendar.
 *
 * Like the rest of lib/, every read degrades to an empty calendar rather than
 * throwing: an unreachable database should cost the Programming page its
 * listings, not the whole site.
 */

export type PublicEvent = {
  id: number;
  slug: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  audience: string | null;
  detail: string;
  lead: string | null;
  status: string;
  schoolName: string | null;
  programName: string | null;
  programSlug: string | null;
  programColor: string | null;
};

type Row = {
  id: number; slug: string; title: string;
  startsAt: Date; endsAt: Date | null;
  location: string | null; audience: string | null; detail: string;
  lead: string | null; status: string;
  school: { name: string } | null;
  program: { name: string; slug: string; heroColor: string } | null;
};

const shape = (e: Row): PublicEvent => ({
  id: e.id,
  slug: e.slug,
  title: e.title,
  startsAt: e.startsAt,
  endsAt: e.endsAt,
  location: e.location,
  audience: e.audience,
  detail: e.detail,
  lead: e.lead,
  status: String(e.status),
  schoolName: e.school?.name ?? null,
  programName: e.program?.name ?? null,
  programSlug: e.program?.slug ?? null,
  programColor: e.program?.heroColor ?? null,
});

const WITH_NAMES = {
  school: { select: { name: true } },
  program: { select: { name: true, slug: true, heroColor: true } },
} as const;

/**
 * What the public Programming page shows: everything published that has not
 * already finished, soonest first.
 *
 * A cancelled event stays visible until its date passes, because a school
 * that was told it was happening needs to see that it is not.
 */
export async function getUpcomingEvents(limit = 60): Promise<PublicEvent[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    // Compare against the start of today, not now — an all-day event happening
    // today should not vanish from the list at one minute past midnight.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.programEvent.findMany({
      where: {
        published: true,
        OR: [{ endsAt: { gte: today } }, { endsAt: null, startsAt: { gte: today } }],
      },
      orderBy: { startsAt: "asc" },
      take: limit,
      select: {
        id: true, slug: true, title: true, startsAt: true, endsAt: true,
        location: true, audience: true, detail: true, lead: true, status: true,
        ...WITH_NAMES,
      },
    });
    return rows.map(shape);
  } catch {
    return [];
  }
}

/** What has already run. The record of a year, newest first. */
export async function getPastEvents(limit = 24): Promise<PublicEvent[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.programEvent.findMany({
      where: {
        published: true,
        status: { not: "CANCELLED" },
        OR: [{ endsAt: { lt: today } }, { endsAt: null, startsAt: { lt: today } }],
      },
      orderBy: { startsAt: "desc" },
      take: limit,
      select: {
        id: true, slug: true, title: true, startsAt: true, endsAt: true,
        location: true, audience: true, detail: true, lead: true, status: true,
        ...WITH_NAMES,
      },
    });
    return rows.map(shape);
  } catch {
    return [];
  }
}

/**
 * The console's view: everything, including drafts and events that have been
 * and gone. This is the programming team's working calendar.
 */
export async function getAllEvents(): Promise<(PublicEvent & { published: boolean; schoolId: string | null; programId: number | null })[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.programEvent.findMany({
      orderBy: { startsAt: "desc" },
      take: 500,
      select: {
        id: true, slug: true, title: true, startsAt: true, endsAt: true,
        location: true, audience: true, detail: true, lead: true, status: true,
        published: true, schoolId: true, programId: true,
        ...WITH_NAMES,
      },
    });
    return rows.map((r) => ({
      ...shape(r),
      published: r.published,
      schoolId: r.schoolId,
      programId: r.programId,
    }));
  } catch {
    return [];
  }
}

/** "14 Oct" / "14–16 Oct" / "28 Oct – 3 Nov". Formatted in UTC, like the cycles. */
export function formatEventDate(startsAt: Date, endsAt: Date | null): string {
  const d = (x: Date) => x.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
  if (!endsAt || endsAt.getTime() === startsAt.getTime()) return d(startsAt);

  const sameMonth =
    startsAt.getUTCMonth() === endsAt.getUTCMonth() &&
    startsAt.getUTCFullYear() === endsAt.getUTCFullYear();
  if (sameMonth) {
    const month = startsAt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    return `${startsAt.getUTCDate()}–${endsAt.getUTCDate()} ${month}`;
  }
  return `${d(startsAt)} – ${d(endsAt)}`;
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  CONFIRMED: "Confirmed",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const EVENT_STATUS_COLORS: Record<string, string> = {
  PLANNED: "#C96C00",
  CONFIRMED: "#1B7F4B",
  DONE: "#2D46AF",
  CANCELLED: "#B8321E",
};
