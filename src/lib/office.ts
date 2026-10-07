import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { buzzRows, buzzViewer, unreadFor } from "@/lib/buzz-feed";

/**
 * The Office — what JOC as a whole is dealing with this week.
 *
 * The Buzz brings its own data; this is the right-hand column and the line of
 * prose at the top. That line is generated rather than written because a
 * summary somebody has to keep up to date is a summary that is wrong by
 * Thursday.
 */

const DAY = 86400000;

export async function getOffice() {
  const empty = {
    summary: "Nothing new this morning.",
    messages: [] as { id: string; school: string; body: string; ago: string; href: string }[],
    events: [] as { id: string; day: string; title: string; meta: string | null; today: boolean }[],
  };
  if (!isDatabaseConfigured()) return empty;

  const now = new Date();
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);

  const [messages, events, rows, viewer, notices] = await Promise.all([
    prisma.schoolMessage.findMany({
      where: { inbound: true, seenAt: null, school: { isTest: false } },
      orderBy: { sentAt: "desc" },
      take: 8,
      select: { id: true, body: true, sentAt: true, school: { select: { id: true, name: true } } },
    }).catch(() => []),

    prisma.schoolActivity.findMany({
      where: {
        type: "EVENT_PLANNED", removedAt: null, school: { isTest: false },
        occurredAt: { gte: midnight, lt: new Date(midnight.getTime() + 14 * DAY) },
      },
      orderBy: { occurredAt: "asc" },
      take: 12,
      select: {
        id: true, occurredAt: true,
        school: { select: { name: true } },
        program: { select: { name: true } },
      },
    }).catch(() => []),

    buzzRows(60).catch(() => []),
    buzzViewer().catch(() => null),
    prisma.notice.count({ where: { takeDownAt: null } }).catch(() => 0),
  ]);

  const unread = viewer ? rows.filter((r) => unreadFor(r, viewer) > 0).length : 0;

  const bits = [
    unread ? (unread === 1 ? "One new Buzz note" : `${unread} new Buzz notes`) : "Nothing new on the Buzz",
    messages.length ? (messages.length === 1 ? "one school waiting on you" : `${messages.length} schools waiting on you`) : null,
    notices ? (notices === 1 ? "one notice on the board" : `${notices} notices on the board`) : null,
  ].filter(Boolean);

  return {
    summary: `${bits.join(", ")}.`,
    messages: messages.map((m) => ({
      id: m.id,
      school: m.school.name,
      body: m.body,
      ago: ago(m.sentAt, now).toUpperCase(),
      href: `/admin/schools/${m.school.id}`,
    })),
    events: events.map((e) => ({
      id: String(e.id),
      day: e.occurredAt < new Date(midnight.getTime() + DAY)
        ? "TODAY"
        : e.occurredAt.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase(),
      title: e.school.name,
      meta: e.program?.name?.toUpperCase() ?? null,
      today: e.occurredAt < new Date(midnight.getTime() + DAY),
    })),
  };
}

function ago(d: Date, from: Date): string {
  const days = Math.round((from.getTime() - d.getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  return `${Math.round(days / 7)} weeks ago`;
}
