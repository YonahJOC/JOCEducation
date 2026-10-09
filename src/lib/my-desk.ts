import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth, openForReview } from "@/auth";
import { isSuperAdminEmail } from "@/lib/access";
import { firstName } from "@/lib/desk";

/**
 * My desk — one person's own work, and nothing else.
 *
 * The rule the whole page rests on: nothing organisation-wide belongs here.
 * Their tasks, their day, what people sent them, their notebook. Everything
 * shared is one tab away in The Office. A desk that also carries the
 * organisation's problems is a desk nobody can clear.
 *
 * Every query here is scoped to the signed-in user and takes no id from the
 * caller, so there is no request that reads somebody else's desk.
 */

export type Task = {
  id: string;
  text: string;
  meta: string | null;
  done: boolean;
  later: boolean;
  /** A task this person handed to somebody else. */
  handedTo: { initial: string; name: string; status: string } | null;
};

export type DayItem = {
  id: string;
  when: Date;
  time: string | null;
  title: string;
  meta: string | null;
  today: boolean;
  /** A diary entry this person added, which they can also remove. */
  own?: string;
  /**
   * What kind of thing it is, for the icon beside it: a school booking
   * (which wears its venue's icon), a call, a meeting, or a task with a date.
   */
  kind: "event" | "call" | "meeting" | "task";
};

export type TrayItem = {
  id: string;
  kind: "mention" | "message" | "ask" | "task";
  initial: string;
  who: string;
  verb: string;
  quote: string;
  source: string;
  canReply: boolean;
};

export type Page = { id: string; title: string; body: string };

const DAY = 86400000;

/**
 * Where a handed-off task has got to, from the sender's side.
 *
 * NOT OPENED → SEEN → ACCEPTED or DECLINED → DONE, with NUDGED standing in
 * whenever the sender has chased since the other person last looked. Decline
 * is reported rather than hidden: the whole point of handing something over
 * is knowing whether it is being done, and a silent refusal is worse than no
 * answer at all.
 */
function handoffStatus(t: {
  seenAt: Date | null; nudgedAt: Date | null; doneAt: Date | null;
  acceptedAt: Date | null; declinedAt: Date | null;
}): string {
  if (t.doneAt) return "DONE";
  if (t.declinedAt) return "DECLINED";
  if (t.acceptedAt) return "ON THEIR LIST";
  if (t.nudgedAt && (!t.seenAt || t.nudgedAt > t.seenAt)) return "NUDGED";
  if (t.seenAt) return "SEEN";
  return "NOT OPENED";
}

export async function getMyDesk() {
  const session = await safeAuth();
  const me = session?.user;
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
  const superAdmin = openForReview || isSuperAdminEmail(me?.email);

  const empty = {
    me: me ?? null, superAdmin, now,
    tasks: [] as Task[], handed: [] as Task[],
    day: [] as DayItem[], tray: [] as TrayItem[],
    pages: [] as Page[], staff: [] as { id: string; name: string }[],
  };

  if (!isDatabaseConfigured() || !me?.id) return empty;
  const mine = me.id;

  const [ownRows, handedRows, events, mentions, messages, asks, offers, diary, cleared, pages, staff] =
    await Promise.all([
      // Mine to do.
      prisma.deskTodo.findMany({
        where: {
          userId: mine,
          // An offer nobody has taken on is not yet a task; it waits in the
          // tray. One they declined is gone from here for good.
          declinedAt: null,
          AND: [
            { OR: [{ assignedById: null }, { acceptedAt: { not: null } }] },
            { OR: [{ doneAt: null }, { doneAt: { gte: midnight } }] },
          ],
        },
        orderBy: [{ doneAt: "asc" }, { createdAt: "desc" }],
        select: {
          id: true, text: true, source: true, whenBucket: true, due: true, doneAt: true, createdAt: true,
          activity: { select: { school: { select: { name: true } } } },
          assignedBy: { select: { name: true, email: true } },
        },
      }).catch(() => []),

      // Handed to somebody else — the same row, read from the other end.
      prisma.deskTodo.findMany({
        where: {
          assignedById: mine, userId: { not: mine },
          OR: [{ doneAt: null }, { doneAt: { gte: midnight } }],
        },
        orderBy: [{ doneAt: "asc" }, { createdAt: "desc" }],
        select: {
          id: true, text: true, due: true, doneAt: true, seenAt: true, nudgedAt: true,
          acceptedAt: true, declinedAt: true,
          user: { select: { name: true, email: true } },
        },
      }).catch(() => []),

      prisma.schoolActivity.findMany({
        where: {
          type: "EVENT_PLANNED", removedAt: null, school: { isTest: false },
          occurredAt: { gte: midnight, lt: new Date(midnight.getTime() + 14 * DAY) },
        },
        orderBy: { occurredAt: "asc" },
        select: {
          id: true, occurredAt: true,
          school: { select: { name: true } },
          program: { select: { name: true } },
        },
      }).catch(() => []),

      // Somebody named them in a Buzz comment.
      prisma.buzzNote.findMany({
        where: {
          authorId: { not: mine },
          createdAt: { gte: new Date(now.getTime() - 21 * DAY) },
          activity: { removedAt: null, school: { isTest: false } },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true, body: true, createdAt: true,
          author: { select: { name: true, email: true } },
          activity: { select: { school: { select: { name: true } } } },
        },
      }).catch(() => []),

      prisma.schoolMessage.findMany({
        where: { inbound: true, seenAt: null, school: { isTest: false } },
        orderBy: { sentAt: "desc" },
        take: 20,
        select: { id: true, body: true, sentAt: true, school: { select: { name: true } } },
      }).catch(() => []),

      prisma.schoolActivity.findMany({
        where: { inbound: true, answeredAt: null, school: { isTest: false } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, detail: true, topic: true, createdAt: true,
          school: { select: { name: true } },
        },
      }).catch(() => []),

      prisma.deskTodo.findMany({
        where: { userId: mine, assignedById: { not: null }, acceptedAt: null, declinedAt: null, doneAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, text: true, createdAt: true,
          assignedBy: { select: { name: true, email: true } },
        },
      }).catch(() => []),

      prisma.deskEvent.findMany({
        where: {
          userId: mine,
          startsAt: { gte: midnight, lt: new Date(midnight.getTime() + 14 * DAY) },
        },
        orderBy: { startsAt: "asc" },
        select: { id: true, title: true, note: true, startsAt: true, allDay: true },
      }).catch(() => []),

      prisma.inTrayCleared.findMany({
        where: { userId: mine }, select: { kind: true, refId: true },
      }).catch(() => []),

      prisma.notebookPage.findMany({
        where: { userId: mine }, orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, body: true },
      }).catch(() => []),

      /**
       * Who a task can be handed to.
       *
       * A JOC address and nothing else. "No school attached" was letting
       * through demo and ambassador accounts, so the picker read as a list
       * of seventeen people when the office has rather fewer — and two of
       * them were the same person twice.
       */
      prisma.user.findMany({
        where: {
          schoolId: null, active: true, id: { not: mine },
          email: { endsWith: "@justonechesed.org", mode: "insensitive" },
        },
        orderBy: [{ name: "asc" }],
        select: { id: true, name: true, email: true },
      }).catch(() => []),
    ]);

  const isCleared = new Set(cleared.map((c) => `${c.kind}:${c.refId}`));

  const myName = me.name ?? me.email ?? "";
  const firstWord = firstName(myName).toLowerCase();

  const tasks: Task[] = ownRows.map((t) => ({
    id: t.id,
    text: t.text,
    done: Boolean(t.doneAt),
    later: t.whenBucket === "LATER",
    handedTo: null,
    meta: [
      t.source === "BUZZ" ? "FROM THE BUZZ"
        : t.source === "NOTEBOOK" ? "FROM YOUR NOTEBOOK"
        : t.assignedBy ? `FROM ${firstName(t.assignedBy.name ?? t.assignedBy.email).toUpperCase()}`
        : null,
      t.activity?.school.name?.toUpperCase() ?? null,
      t.due ? `BY ${t.due.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}` : null,
    ].filter(Boolean).join(" · ") || null,
  }));

  const handed: Task[] = handedRows.map((t) => ({
    id: t.id,
    text: t.text,
    done: Boolean(t.doneAt),
    later: false,
    meta: null,
    handedTo: {
      initial: firstName(t.user.name ?? t.user.email).slice(0, 1).toUpperCase(),
      name: firstName(t.user.name ?? t.user.email),
      status: handoffStatus(t),
    },
  }));

  const dated = ownRows.filter((t) => t.due && !t.doneAt);
  const day: DayItem[] = [
    ...events.map((e) => ({
      id: `e${e.id}`,
      when: e.occurredAt,
      time: e.occurredAt.getUTCHours() === 0 && e.occurredAt.getUTCMinutes() === 0
        ? null
        : e.occurredAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
      title: e.school.name,
      meta: (e.program?.name ?? "No program").toUpperCase(),
      today: e.occurredAt < new Date(midnight.getTime() + DAY),
      kind: "event" as const,
    })),
    ...diary.map((d) => ({
      id: `d${d.id}`,
      when: d.startsAt,
      time: d.allDay
        ? null
        : d.startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
      title: d.title,
      meta: d.note?.toUpperCase() ?? null,
      today: d.startsAt < new Date(midnight.getTime() + DAY),
      own: d.id,
      kind: /call|phone/i.test(`${d.title} ${d.note ?? ""}`) ? ("call" as const) : ("meeting" as const),
    })),
    ...dated.map((t) => ({
      id: `t${t.id}`,
      when: t.due!,
      time: null,
      title: t.text,
      meta: null,
      today: t.due! < new Date(midnight.getTime() + DAY),
      kind: "task" as const,
    })),
  ].sort((a, b) => a.when.getTime() - b.when.getTime());

  /**
   * For you: somebody named you, a school wrote in, a school asked.
   *
   * A mention is a comment with this person's first name in it. Crude, and
   * the alternative is a @-picker nobody will use while they are typing on a
   * phone in a car park.
   */
  const tray: TrayItem[] = [
    ...(firstWord.length > 2 ? mentions : [])
      .filter((n) => n.body.toLowerCase().includes(firstWord))
      .filter((n) => !isCleared.has(`mention:${n.id}`))
      .map((n) => ({
        id: n.id,
        kind: "mention" as const,
        initial: firstName(n.author?.name ?? n.author?.email).slice(0, 1).toUpperCase(),
        who: firstName(n.author?.name ?? n.author?.email),
        verb: "mentioned you on the Buzz",
        quote: n.body,
        source: `${n.activity.school.name} · ${ago(n.createdAt, now)}`.toUpperCase(),
        canReply: false,
      })),
    ...offers.map((o) => ({
      id: o.id,
      kind: "task" as const,
      initial: firstName(o.assignedBy?.name ?? o.assignedBy?.email).slice(0, 1).toUpperCase(),
      who: firstName(o.assignedBy?.name ?? o.assignedBy?.email),
      verb: "asked you to do something",
      quote: o.text,
      source: `HANDED TO YOU · ${ago(o.createdAt, now)}`.toUpperCase(),
      canReply: false,
    })),
    ...messages
      .filter((m) => !isCleared.has(`message:${m.id}`))
      .map((m) => ({
        id: m.id,
        kind: "message" as const,
        initial: m.school.name.slice(0, 1).toUpperCase(),
        who: m.school.name,
        verb: "wrote in",
        quote: m.body,
        source: `${m.school.name} · ${ago(m.sentAt, now)}`.toUpperCase(),
        canReply: true,
      })),
    ...asks
      .filter((a) => !isCleared.has(`ask:${a.id}`))
      .map((a) => ({
        id: a.id,
        kind: "ask" as const,
        initial: a.school.name.slice(0, 1).toUpperCase(),
        who: a.school.name,
        verb: `asked about ${a.topic ?? "something"}`,
        quote: a.detail ?? "They left no detail.",
        source: `${a.school.name} · ${ago(a.createdAt, now)}`.toUpperCase(),
        canReply: true,
      })),
  ];

  return {
    me, superAdmin, now,
    tasks, handed, day, tray,
    pages: pages as Page[],
    // One row per address: the same person has two accounts in a couple of
    // cases, and a picker offering "Wayne" twice is a picker nobody trusts.
    staff: dedupe(staff),
  };
}

/** One entry per human, named rather than addressed where we know the name. */
function dedupe(rows: { id: string; name: string | null; email: string | null }[]) {
  const byName = new Map<string, { id: string; name: string }>();
  for (const r of rows) {
    const name = r.name?.trim() || r.email?.split("@")[0] || "somebody";
    const key = name.toLowerCase();
    // First one wins, except that a full name beats a bare mailbox.
    const held = byName.get(key);
    if (!held || (!held.name.includes(" ") && name.includes(" "))) {
      byName.set(key, { id: r.id, name });
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function ago(d: Date, from: Date): string {
  const days = Math.round((from.getTime() - d.getTime()) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  if (days < 14) return `${days} days`;
  return `${Math.round(days / 7)} weeks`;
}

/**
 * The two numbers in the rail: how much is waiting on this person, and how
 * much is new in the office.
 *
 * Deliberately cheaper than getMyDesk — every console page renders the rail,
 * and nobody needs a notebook query to draw a badge. It reads ids only.
 */
export async function deskBadges(): Promise<{ desk: number; office: number }> {
  const none = { desk: 0, office: 0 };
  const session = await safeAuth();
  const me = session?.user;
  if (!isDatabaseConfigured() || !me?.id) return none;

  const mine = me.id;
  const since = new Date(Date.now() - 21 * DAY);
  const firstWord = firstName(me.name ?? me.email ?? "").toLowerCase();

  try {
    const [mentions, messages, asks, offers, cleared, notes, seen] = await Promise.all([
      firstWord.length > 2
        ? prisma.buzzNote.findMany({
            where: {
              authorId: { not: mine }, createdAt: { gte: since },
              body: { contains: firstWord, mode: "insensitive" },
              activity: { removedAt: null, school: { isTest: false } },
            },
            select: { id: true },
          })
        : Promise.resolve([] as { id: string }[]),
      prisma.schoolMessage.findMany({
        where: { inbound: true, seenAt: null, school: { isTest: false } },
        select: { id: true },
      }),
      prisma.schoolActivity.findMany({
        where: { inbound: true, answeredAt: null, school: { isTest: false } },
        select: { id: true },
      }),
      prisma.deskTodo.count({
        where: { userId: mine, assignedById: { not: null }, acceptedAt: null, declinedAt: null, doneAt: null },
      }),
      prisma.inTrayCleared.findMany({ where: { userId: mine }, select: { kind: true, refId: true } }),
      prisma.buzzNote.findMany({
        where: { authorId: { not: mine }, activity: { removedAt: null, school: { isTest: false } } },
        select: { activityId: true, createdAt: true },
      }),
      prisma.buzzSeen.findMany({ where: { userId: mine }, select: { activityId: true, seenAt: true } }),
    ]);

    const gone = new Set(cleared.map((c) => `${c.kind}:${c.refId}`));
    const desk =
      offers +
      mentions.filter((m) => !gone.has(`mention:${m.id}`)).length +
      messages.filter((m) => !gone.has(`message:${m.id}`)).length +
      asks.filter((a) => !gone.has(`ask:${a.id}`)).length;

    const last = new Map(seen.map((s) => [s.activityId, s.seenAt]));
    const office = new Set(
      notes.filter((n) => {
        const at = last.get(n.activityId);
        return !at || n.createdAt > at;
      }).map((n) => n.activityId),
    ).size;

    return { desk, office };
  } catch {
    return none;
  }
}
