import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { safeAuth } from "@/auth";
import { can } from "@/lib/access";
import { missingEnv } from "@/lib/boot";
import type { Tone } from "@/lib/joc-tokens";

/**
 * What needs each person at JOC today.
 *
 * Built from capabilities rather than roles, so somebody with an unusual
 * admin type gets rows about the work they can actually do.
 *
 * A row is a band label, one figure, a title and one line. The figure is the
 * point — it is what somebody reads first — and the line stops at about
 * ninety characters, because anything longer belongs on the page the action
 * opens rather than in a list.
 */

export type TodayRow = {
  id: string;
  /** Above the figure: "NOT PAID". */
  label: string;
  /** The figure itself: "3", "14 days", "Past due". */
  figure?: string;
  /** The thing itself: a school's name, or "3 features switched off". */
  title: string;
  /** One line, around ninety characters. */
  line?: string;
  tone: Tone;
  action: { label: string; href: string } | null;
  weight: number;
};

export type TodayFigure = { label: string; value: string };

export type Today = {
  title: string;
  rows: TodayRow[];
  /** Real counts only. A word where a number goes is not a figure. */
  figures: TodayFigure[];
};

const days = (from: Date, now: number) => Math.floor((now - from.getTime()) / 86_400_000);

/**
 * @param who Whose Today. Defaults to the signed-in person; passing one is
 *   how this gets tested, because the rows a person sees are entirely a
 *   function of their capabilities and that is the part worth checking.
 */
export async function getToday(
  // id as well as the capabilities, so the page can show somebody the items
  // they themselves raised rather than only what their permissions allow.
  who?: Parameters<typeof can>[0] & { name?: string | null; id?: string | null },
): Promise<Today> {
  const empty: Today = { title: "Nothing needs you today", rows: [], figures: [] };
  if (!isDatabaseConfigured()) return empty;

  try {
    const me = who ?? (await safeAuth())?.user;
    const now = Date.now();
    const rows: TodayRow[] = [];
    const figures: TodayFigure[] = [];

    // ── Anything a school sent in ─────────────────────────────────────────
    //
    // A school can now reach us three ways from inside the portal: ask a
    // coordinator something, press "I'd like lessons" on a page that is not
    // theirs yet, or write in the message thread. All three landed somewhere
    // a coordinator had to go looking — the program console, an inquiry
    // table, the school's own panel — so the one page they open every
    // morning said nothing about any of it.
    //
    // Nothing here is scoped by program on purpose: a question from a school
    // waiting a week is worse than a tidy page, and whoever sees it first can
    // pass it on.
    {
      const [asks, inquiries, unread] = await Promise.all([
        prisma.schoolActivity.findMany({
          where: { inbound: true, answeredAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, topic: true, detail: true, createdAt: true,
            school: { select: { name: true } },
            program: { select: { slug: true, name: true } },
          },
        }),
        prisma.inquiry.findMany({
          where: { status: "OPEN" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, kind: true, createdAt: true,
            school: { select: { name: true } },
          },
        }),
        prisma.schoolMessage.findMany({
          where: { inbound: true, seenAt: null },
          orderBy: { sentAt: "asc" },
          select: {
            id: true, body: true, sentAt: true,
            school: { select: { name: true } },
          },
        }),
      ]);

      const days = (d: Date) => Math.floor((now - d.getTime()) / 86_400_000);
      const old = (d: Date) => {
        const n = days(d);
        return n === 0 ? "today" : `${n} day${n === 1 ? "" : "s"}`;
      };

      for (const a of asks) {
        rows.push({
          id: `ask:${a.id}`,
          label: `Asked · ${a.topic ?? "something"}`,
          figure: old(a.createdAt),
          title: a.school.name,
          line: (a.detail ?? "").slice(0, 150) || "They left no detail.",
          tone: "info",
          weight: 5200 + days(a.createdAt),
          action: a.program
            ? { label: `Open ${a.program.name}`, href: `/admin/programs/${a.program.slug}` }
            : { label: "Open schools", href: "/admin/schools" },
        });
      }

      for (const m of unread) {
        rows.push({
          id: `msg:${m.id}`,
          label: "Wrote in",
          figure: old(m.sentAt),
          title: m.school.name,
          line: m.body.slice(0, 150),
          tone: "info",
          weight: 5100 + days(m.sentAt),
          action: { label: "Open schools", href: "/admin/schools" },
        });
      }

      // Grouped: ten schools asking for the lesson library is one fact about
      // the library, not ten things to read.
      const byKind = new Map<string, { n: number; names: string[]; oldest: Date }>();
      for (const i of inquiries) {
        const k = byKind.get(i.kind) ?? { n: 0, names: [], oldest: i.createdAt };
        k.n++;
        if (k.names.length < 4) k.names.push(i.school.name);
        if (i.createdAt < k.oldest) k.oldest = i.createdAt;
        byKind.set(i.kind, k);
      }

      for (const [kind, k] of byKind) {
        rows.push({
          id: `inquiry:${kind}`,
          label: "Asked for",
          figure: String(k.n),
          title: `${k.n} school${k.n === 1 ? "" : "s"} asked about ${kind.replace(/-/g, " ")}`,
          line: `${k.names.join(", ")}${k.n > k.names.length ? ` and ${k.n - k.names.length} more` : ""}. Waiting ${old(k.oldest)}.`,
          tone: "info",
          weight: 5000 + days(k.oldest),
          action: { label: "Open schools", href: "/admin/schools" },
        });
      }
    }

    // ── Whoever keeps the lights on ───────────────────────────────────────
    // A feature switched off by a missing variable is invisible otherwise: it
    // simply never runs, and nothing anywhere says why.
    if (can(me, "users")) {
      const missing = missingEnv();
      if (missing.length > 0) {
        rows.push({
          id: "env",
          label: "Switched off",
          figure: String(missing.length),
          title: `${missing.length} feature${missing.length === 1 ? "" : "s"} switched off`,
          line: `${missing[0].name} and ${missing.length - 1} other setting${missing.length === 2 ? "" : "s"} are missing.`,
          tone: "system",
          weight: 9000,
          action: { label: "See which", href: "/admin/guide" },
        });
      }
    }

    // ── School accounts ───────────────────────────────────────────────────
    if (can(me, "schools")) {
      const [pastDue, lapsed, schools, contacts] = await Promise.all([
        prisma.subscription.findMany({
          where: { status: "PAST_DUE" },
          select: { school: { select: { id: true, name: true } } },
        }),
        prisma.school.count({ where: { status: "LAPSED" } }),
        prisma.school.count(),
        // Schools that have somebody to ring, not contact rows. Counting
        // rows meant two contacts at one school made the figure better while
        // nothing had improved, and it read 34 of 39 when the true answer
        // was 36.
        prisma.school.count({ where: { contacts: { some: {} } } }),
      ]);

      for (const p of pastDue.slice(0, 3)) {
        rows.push({
          id: `pastdue:${p.school.id}`,
          label: "Not paid",
          figure: "Past due",
          title: p.school.name,
          line: "Their subscription is past due.",
          tone: "warn",
          weight: 5000,
          action: { label: "Open school", href: `/admin/schools/${p.school.id}` },
        });
      }

      if (lapsed > 0) {
        rows.push({
          id: "lapsed",
          label: "Lapsed",
          figure: String(lapsed),
          title: `${lapsed} school${lapsed === 1 ? "" : "s"} lapsed`,
          line: "Nobody has picked them up.",
          tone: "warn",
          weight: 3000,
          action: { label: "Open schools", href: "/admin/schools?status=LAPSED" },
        });
      }

      // A school with nobody to ring is a school the traffic light cannot act on.
      if (schools > 0 && contacts < schools / 2) {
        rows.push({
          id: "contacts",
          label: "No contact",
          figure: String(schools - contacts),
          title: "Most schools have nobody to ring",
          line: `${schools - contacts} of ${schools} have no contact recorded.`,
          tone: "warn",
          weight: 2500,
          action: { label: "Open schools", href: "/admin/schools" },
        });
      }

      figures.push({ label: "Schools", value: String(schools) });
    }

    if (can(me, "demos")) {
      const demos = await prisma.demoRequest.count({ where: { status: "NEW" } });
      if (demos > 0) {
        rows.push({
          id: "demos",
          label: "New request",
          figure: String(demos),
          title: `${demos} school${demos === 1 ? "" : "s"} asked for a walkthrough`,
          line: "Nobody has answered them.",
          tone: "info",
          weight: 4000,
          action: { label: "Open requests", href: "/admin/demos" },
        });
      }
    }

    // ── A coordinator's own items at the meeting ──────────────────────────
    //
    // The block below belongs to whoever runs the meeting. A coordinator who
    // sent a school for a decision is not that person, so their own item —
    // the thing they are waiting on — appeared nowhere on the page they open
    // every morning. They had to remember they had raised it, and go looking.
    //
    // Two things matter to them and nothing else does: has it been decided,
    // and when is it being discussed.
    if (me?.id && !can(me, "run_admin_agenda")) {
      const mine = await prisma.adminMeetingItem.findMany({
        where: { createdById: me.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, outcome: true, outcomeNote: true, outcomeAt: true,
          school: { select: { name: true } },
          program: { select: { slug: true, name: true } },
          meeting: { select: { meetsAt: true, closedAt: true } },
        },
      });

      // Decided, and they have not been told. One row each — a decision about
      // a named school is not something to bundle into a count.
      for (const i of mine.filter((x) => x.outcome && x.outcomeAt)) {
        rows.push({
          id: `decided:${i.id}`,
          label: `Decided · ${String(i.outcome).toLowerCase().replace(/_/g, " ")}`,
          figure: i.outcomeAt!.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          title: `${i.school.name} — ${i.program.name}`,
          line: i.outcomeNote?.slice(0, 150) || "No note was left with the decision.",
          tone: "good",
          weight: 4000,
          action: { label: "Open the program", href: `/admin/programs/${i.program.slug}` },
        });
      }

      const waiting = mine.filter((x) => !x.outcome && !x.meeting.closedAt);
      if (waiting.length > 0) {
        const next = waiting
          .map((w) => w.meeting.meetsAt)
          .sort((a, b) => a.getTime() - b.getTime())[0];

        rows.push({
          id: "my-agenda",
          label: "At the meeting",
          figure: next.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          title: `${waiting.length} of your school${waiting.length === 1 ? "" : "s"} ${waiting.length === 1 ? "is" : "are"} on the agenda`,
          line: waiting.map((w) => w.school.name).slice(0, 4).join(", "),
          tone: "info",
          weight: 2600,
          action: { label: "See your items", href: "/admin/meetings" },
        });
      }
    }

    // ── The admin meeting ─────────────────────────────────────────────────
    if (can(me, "run_admin_agenda")) {
      const meeting = await prisma.adminMeeting.findFirst({
        where: { closedAt: null, meetsAt: { gte: new Date() } },
        orderBy: { meetsAt: "asc" },
        include: { items: { select: { outcome: true } } },
      });

      if (!meeting) {
        const waiting = await prisma.adminMeetingItem.count({ where: { outcome: null } });
        rows.push({
          id: "no-meeting",
          label: "No meeting",
          figure: waiting > 0 ? String(waiting) : "None",
          title: "No admin meeting is booked",
          line:
            waiting > 0
              ? `${waiting} school${waiting === 1 ? " is" : "s are"} waiting on a decision.`
              : "An orange or red school has nowhere to go.",
          tone: "warn",
          weight: 3500,
          action: { label: "Book one", href: "/admin/meetings" },
        });
      } else {
        const undecided = meeting.items.filter((i) => !i.outcome).length;
        rows.push({
          id: "meeting",
          label: "Next meeting",
          figure: meeting.meetsAt.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          title:
            meeting.items.length === 0
              ? "Nothing on the agenda yet"
              : `${meeting.items.length} school${meeting.items.length === 1 ? "" : "s"} on the agenda`,
          line: meeting.items.length === 0 ? undefined : `${undecided} still to decide.`,
          tone: undecided > 0 ? "info" : "good",
          weight: 2000,
          action: { label: "Open the meeting", href: "/admin/meetings" },
        });
      }
    }

    // ── Teaching material ─────────────────────────────────────────────────
    if (can(me, "lessons")) {
      const [unpublished, resources, published] = await Promise.all([
        prisma.lessonPlan.findMany({
          where: { published: false },
          select: { id: true, updatedAt: true },
        }),
        prisma.resource.count({ where: { published: true } }),
        prisma.lessonPlan.count({ where: { published: true } }),
      ]);

      const stale = unpublished.filter((l) => days(l.updatedAt, now) > 14);
      if (stale.length > 0) {
        rows.push({
          id: "unpublished",
          label: "Unpublished",
          figure: String(stale.length),
          title: `${stale.length} lesson${stale.length === 1 ? "" : "s"} still a draft`,
          line: "Each has sat more than a fortnight. Nobody can teach a draft.",
          tone: "warn",
          weight: 2200,
          action: { label: "Open lessons", href: "/admin/lessons" },
        });
      }

      if (resources === 0) {
        rows.push({
          id: "resources",
          label: "Library",
          figure: "Empty",
          title: "No resource is published",
          line: "The library is what a school renews for.",
          tone: "warn",
          weight: 2600,
          action: { label: "Open resources", href: "/admin/resources" },
        });
      }

      figures.push({ label: "Lessons live", value: String(published) });
      figures.push({ label: "Resources", value: String(resources) });
    }

    // There was a row here telling whoever opened this page that all eight
    // cycle dates were unchecked. It counted the cycles and called every one
    // of them unverified, because nothing on Cycle records whether anybody
    // has checked it. It would have said "8 cycle dates unchecked" forever,
    // however many times somebody went and checked them — a job that can
    // never be finished and a number that never moves. Removed rather than
    // given a column, because the console should not invent a workflow.

    if (can(me, "board")) {
      const waiting = await prisma.boardPost.count({ where: { approved: false } });
      if (waiting > 0) {
        rows.push({
          id: "board",
          label: "Waiting",
          figure: String(waiting),
          title: `${waiting} board post${waiting === 1 ? "" : "s"} to approve`,
          tone: "info",
          weight: 1500,
          action: { label: "Open the board", href: "/admin/board" },
        });
      }
    }

    // ── The calendar ──────────────────────────────────────────────────────
    if (can(me, "programming")) {
      const soon = new Date(now + 7 * 86_400_000);
      const unannounced = await prisma.programEvent.count({
        where: { published: false, status: { not: "CANCELLED" }, startsAt: { gte: new Date(), lte: soon } },
      });
      if (unannounced > 0) {
        rows.push({
          id: "unannounced",
          label: "Not announced",
          figure: String(unannounced),
          title: `${unannounced} run${unannounced === 1 ? "" : "s"} this week unpublished`,
          line: "Nobody outside the console can see them.",
          tone: "warn",
          weight: 4500,
          action: { label: "Open the calendar", href: "/admin/programming" },
        });
      }

      const amber = await prisma.schoolProgramLight.count({ where: { light: "AMBER" } });
      figures.push({ label: "Discuss first", value: String(amber) });
    }

    rows.sort((a, b) => b.weight - a.weight);

    // Solid orange belongs to one row on a screen. The heaviest earns it, and
    // only when it is a thing that has gone wrong rather than an answer.
    const top = rows[0];
    if (top && (top.tone === "warn" || top.tone === "system")) top.tone = "urgent";

    const name = me?.name?.trim().split(/\s+/)[0];
    return {
      title: headline(rows.length, name),
      rows,
      figures: figures.slice(0, 4),
    };
  } catch {
    return empty;
  }
}

/**
 * The heading, which is the answer rather than the word "Today".
 *
 * Somebody opening this page is asking one question. A heading that repeats
 * the nav item they just clicked does not answer it; a count does. 3a reads
 * "Three things need you".
 */
const WORD = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

function headline(n: number, name?: string): string {
  if (n === 0) return name ? `Nothing needs you, ${name}` : "Nothing needs you today";
  const count = n <= 10 ? WORD[n] : String(n);
  return `${count} thing${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} you`;
}
