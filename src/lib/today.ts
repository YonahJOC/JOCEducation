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
  who?: Parameters<typeof can>[0] & { name?: string | null },
): Promise<Today> {
  const empty: Today = { title: "Nothing needs you today", rows: [], figures: [] };
  if (!isDatabaseConfigured()) return empty;

  try {
    const me = who ?? (await safeAuth())?.user;
    const now = Date.now();
    const rows: TodayRow[] = [];
    const figures: TodayFigure[] = [];

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
        prisma.schoolContact.count(),
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

    // Unverified cycle dates are a row, not a figure. "Unverified" is a word,
    // and a word in the figures strip reads as a number that failed to load.
    if (can(me, "cycles")) {
      const cycles = await prisma.cycle.count();
      if (cycles > 0) {
        rows.push({
          id: "cycle-dates",
          label: "Unchecked",
          figure: String(cycles),
          title: `${cycles} cycle dates unchecked`,
          line: "Nobody has verified them against a 5787 luach.",
          tone: "warn",
          weight: 1200,
          action: { label: "Open the cycles", href: "/admin/cycles" },
        });
      }
    }

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
