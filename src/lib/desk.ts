import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { isSuperAdminEmail } from "@/lib/access";
import { listProgramsForAdmin } from "@/lib/program-admin";

/**
 * My desk — what one person needs, in one read.
 *
 * The page is per person: a coordinator with one program and three schools
 * and a super admin with forty-four open the same URL. Everything here is
 * scoped by who is asking, and a section with nothing in it says so rather
 * than disappearing — a page whose shape changes between people is a page
 * nobody can be told how to use.
 */

export type DeskTodo = {
  id: string;
  text: string;
  meta: string;
  done: boolean;
  activityId: string | null;
};

export type DiaryItem = {
  key: string;
  kind: "event" | "due";
  when: Date;
  time: string | null;
  title: string;
  line: string;
};

export type PatchCard = {
  id: string;
  name: string;
  href: string;
  tone: "good" | "warn" | "quiet";
  status: string;
  facts: { key: string; value: string }[];
};

export type Notice = {
  id: string;
  dept: string;
  title: string;
  body: string;
  author: string;
  ago: string;
  read: boolean;
};

const DAY = 86400000;

/** How long ago, said the way a person would say it. */
function ago(d: Date, from: Date): string {
  const days = Math.round((from.getTime() - d.getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.round(days / 7)} weeks ago`;
}

/** First name only. */
export function firstName(who: string | null | undefined): string {
  if (!who) return "there";
  return who.includes("@") ? who.split("@")[0] : who.split(/\s+/)[0];
}

/** Morning until noon, afternoon until six, evening after. */
export function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The date line: Gregorian, then the Hebrew date.
 *
 * Intl does the Hebrew calendar, so there is no table to keep and no library
 * to go stale. It rolls at midnight rather than nightfall — the honest
 * version needs a location and a sunset, and a console is not a siddur.
 */
export function dateLine(now: Date): string {
  const greg = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  }).toUpperCase();

  let hebrew = "";
  try {
    hebrew = new Intl.DateTimeFormat("en-u-ca-hebrew", {
      day: "numeric", month: "long",
    }).format(now).toUpperCase();
  } catch {
    // An engine without the Hebrew calendar: the Gregorian date alone.
  }

  return hebrew ? `${greg} · ${hebrew}` : greg;
}

export async function getDesk() {
  const session = await safeAuth();
  const me = session?.user;
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);

  const superAdmin = openForReview || isSuperAdminEmail(me?.email);

  if (!isDatabaseConfigured()) {
    return {
      me: me ?? null, superAdmin, now,
      todos: [] as DeskTodo[], diary: [] as DiaryItem[],
      patch: [] as PatchCard[], patchLabel: "Your programs",
      notices: [] as Notice[], fresh: null as Notice | null,
    };
  }

  /**
   * Nobody signed in — reviewing the page locally, where openForReview opens
   * the console without a session.
   *
   * Only the two per-person lists are skipped. Bailing out of the whole page
   * meant every local look at it showed an empty desk, which is how a page
   * gets shipped having only ever been seen in its empty state.
   */
  const mine = me?.id ?? null;

  const [todoRows, events, noticeRows, reads, programs] = await Promise.all([
    mine ? prisma.deskTodo.findMany({
      where: {
        userId: mine,
        // Done items clear at midnight: a list still showing yesterday's
        // ticks is a list you scroll past.
        OR: [{ doneAt: null }, { doneAt: { gte: midnight } }],
      },
      orderBy: [{ doneAt: "asc" }, { createdAt: "desc" }],
      select: {
        id: true, text: true, source: true, due: true, doneAt: true, createdAt: true,
        activityId: true,
        activity: { select: { school: { select: { name: true } } } },
        assignedBy: { select: { name: true, email: true } },
      },
    }).catch(() => []) : Promise.resolve([]),

    prisma.schoolActivity.findMany({
      where: {
        type: "EVENT_PLANNED",
        removedAt: null,
        school: { isTest: false },
        occurredAt: { gte: midnight, lt: new Date(midnight.getTime() + 21 * DAY) },
      },
      orderBy: { occurredAt: "asc" },
      select: {
        id: true, occurredAt: true,
        school: { select: { name: true } },
        program: { select: { name: true } },
        author: { select: { name: true, email: true } },
      },
    }).catch(() => []),

    prisma.notice.findMany({
      where: { OR: [{ takeDownAt: null }, { takeDownAt: { gte: now } }] },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, dept: true, title: true, body: true, createdAt: true,
        author: { select: { name: true, email: true } },
      },
    }).catch(() => []),

    mine ? prisma.noticeRead.findMany({
      where: { userId: mine }, select: { noticeId: true },
    }).catch(() => []) : Promise.resolve([]),

    listProgramsForAdmin().catch(() => []),
  ]);

  const readIds = new Set(reads.map((r) => r.noticeId));

  const todos: DeskTodo[] = todoRows.map((t) => ({
    id: t.id,
    text: t.text,
    done: Boolean(t.doneAt),
    activityId: t.activityId,
    meta: [
      t.source === "BUZZ" ? "FROM THE BUZZ" :
      t.source === "ASSIGNED" ? `FROM ${firstName(t.assignedBy?.name ?? t.assignedBy?.email).toUpperCase()}` :
      "ADDED BY YOU",
      t.activity?.school.name?.toUpperCase() ?? null,
      t.due ? `BY ${t.due.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}` : null,
    ].filter(Boolean).join(" · "),
  }));

  // Events and dated to-dos share the diary: both are a thing on a day.
  const diary: DiaryItem[] = [
    ...events.map((e) => ({
      key: `e${e.id}`,
      kind: "event" as const,
      when: e.occurredAt,
      time: e.occurredAt.getUTCHours() === 0 && e.occurredAt.getUTCMinutes() === 0
        ? null
        : e.occurredAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
      title: e.school.name,
      line: [e.program?.name ?? "No program", firstName(e.author?.name ?? e.author?.email)]
        .join(" · ").toUpperCase(),
    })),
    ...todoRows
      .filter((t) => t.due && !t.doneAt)
      .map((t) => ({
        key: `t${t.id}`,
        kind: "due" as const,
        when: t.due!,
        time: null,
        title: t.text,
        line: "DUE",
      })),
  ].sort((a, b) => a.when.getTime() - b.when.getTime());

  // A coordinator's patch is their schools; a super admin's is the programs.
  const patch: PatchCard[] = superAdmin
    ? programs.map((p) => ({
        id: String(p.id),
        name: p.name,
        href: `/admin/programs/${p.slug}`,
        tone: p.published ? ("good" as const) : ("quiet" as const),
        status: p.published ? "Live" : "Draft",
        facts: [
          { key: "RUN BY", value: p.lead ?? "Nobody yet" },
          { key: "SIGN-UPS", value: String(p.responseCount) },
        ],
      }))
    : programs.map((p) => ({
        id: String(p.id),
        name: p.name,
        href: `/admin/programs/${p.slug}`,
        tone: "good" as const,
        status: p.published ? "Live" : "Draft",
        facts: [
          { key: "RUN BY", value: p.lead ?? "Nobody yet" },
          { key: "SIGN-UPS", value: String(p.responseCount) },
        ],
      }));

  const notices: Notice[] = noticeRows.map((n) => ({
    id: n.id,
    dept: n.dept.toUpperCase(),
    title: n.title,
    body: n.body,
    author: firstName(n.author?.name ?? n.author?.email),
    ago: ago(n.createdAt, now),
    read: readIds.has(n.id),
  }));

  // The one notice that earns a place across the top: newest, unread, and
  // under two days old. Anything older is news nobody needs interrupting for.
  const fresh = notices.find(
    (n) => !n.read && (n.ago === "today" || n.ago === "yesterday"),
  ) ?? null;

  return {
    me, superAdmin, now,
    todos, diary, patch,
    patchLabel: "Your programs",
    notices, fresh,
  };
}
