import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { stepFor, STEP_TITLE } from "@/lib/program-step";
import { STAGE_LABEL, type Stage } from "@/lib/program-enrollment";
import type { Tone } from "@/lib/joc-tokens";

/**
 * What a school has to do this week (5a).
 *
 * The console's version of this list is worst-first because a coordinator is
 * triaging thirty-nine schools. A school is looking at its own three
 * programs, so the ordering is different: what is waiting on a person here
 * comes before what is waiting on us, and a date comes before both.
 *
 * Two rules the console does not have:
 *
 *   **At most one solid-orange band.** Orange on this side means "you are
 *   holding something up". Two of them and the page reads as a telling-off,
 *   which is not what a school that runs a program with us should open to.
 *
 *   **No student names, ever.** Participation figures are the student's own
 *   estimate and say so. A name belongs to the supervising teacher's page.
 */

/** A run inside this window is close enough to be worth saying. */
const SOON_DAYS = 14;

export type SchoolTodayKind =
  | "TO_APPROVE"
  | "NEXT_RUN"
  | "NEXT_STEP"
  | "NEW_WRITE_UP"
  | "REPLY";

export type SchoolTodayRow = {
  id: string;
  kind: SchoolTodayKind;
  /** Above the figure: "TO APPROVE". */
  label: string;
  /** The figure itself: "28.5 h", "Wed 30 Sep", "3". */
  figure: string;
  /** True when the figure is words rather than a number, so it sets smaller. */
  word?: boolean;
  tone: Tone;
  /** Higher first. */
  weight: number;
  title: string;
  line: string;
  action?: { label: string; href: string };
};

export type SchoolToday = {
  rows: SchoolTodayRow[];
  programs: {
    id: number;
    slug: string;
    name: string;
    heroColor: string;
    stage: Stage;
    step: number;
    since: Date;
    /** The one figure worth reading on the card, or null when nothing is recorded. */
    headline: string | null;
  }[];
};

const EMPTY: SchoolToday = { rows: [], programs: [] };

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

const dateOnly = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/** Stages where the school is still being set up, so a next step exists. */
const SETUP: Stage[] = ["INTRODUCED", "MEETING_BOOKED", "REGISTERED", "MATERIALS_SENT"];

export async function getSchoolToday(
  schoolId: string,
  opts: { canReadReports: boolean },
): Promise<SchoolToday> {
  if (!isDatabaseConfigured()) return EMPTY;

  try {
    const now = Date.now();
    const soon = new Date(now + SOON_DAYS * 86_400_000);

    const [school, enrollments, events, unread, replies, reportCounts] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          unapprovedHours: true,
          unapprovedCheckedAt: true,
          appStats: {
            select: { unapprovedMinutes: true, unapprovedOldestAt: true, syncedAt: true },
          },
        },
      }),
      prisma.programEnrollment.findMany({
        where: { schoolId },
        select: {
          stage: true, stageSince: true,
          program: { select: { id: true, slug: true, name: true, heroColor: true } },
        },
      }),
      prisma.programEvent.findMany({
        where: {
          schoolId,
          status: { not: "CANCELLED" },
          startsAt: { gte: new Date(now), lte: soon },
        },
        orderBy: { startsAt: "asc" },
        take: 1,
        select: {
          id: true, title: true, startsAt: true, location: true, audience: true,
          program: { select: { slug: true, name: true } },
        },
      }),
      opts.canReadReports
        ? prisma.eventReport.count({
            where: { ambassador: { schoolId }, seenBySupervisorAt: null },
          })
        : Promise.resolve(0),
      // Only an ask a coordinator actually wrote words on. "Answered" with no
      // words is a status change, and a school has no use for one.
      prisma.schoolActivity.findMany({
        where: {
          schoolId, inbound: true,
          answeredAt: { not: null }, reply: { not: null }, seenBySchoolAt: null,
        },
        orderBy: { answeredAt: "desc" },
        take: 3,
        select: {
          id: true, reply: true, answeredAt: true, topic: true,
          answeredBy: { select: { name: true, email: true } },
          program: { select: { slug: true, name: true } },
        },
      }),
      // Enough to put one honest figure on each program card.
      prisma.eventReport.groupBy({
        by: ["ambassadorId"],
        where: { ambassador: { schoolId } },
        _count: { _all: true },
      }).catch(() => []),
    ]);

    const rows: SchoolTodayRow[] = [];

    // 1. Hours a teacher has not approved. The one thing on this page that is
    //    genuinely waiting on somebody at the school.
    const hours = school?.appStats
      ? {
          minutes: school.appStats.unapprovedMinutes,
          oldest: school.appStats.unapprovedOldestAt,
          at: school.appStats.syncedAt,
        }
      : school?.unapprovedHours != null
      ? { minutes: school.unapprovedHours * 60, oldest: null, at: school.unapprovedCheckedAt }
      : null;

    if (hours && hours.minutes > 0) {
      rows.push({
        id: "to-approve",
        kind: "TO_APPROVE",
        label: "To approve",
        figure: `${(hours.minutes / 60).toFixed(1)} h`,
        tone: "warn",
        weight: 100,
        title: "Chesed hours waiting on a teacher",
        line: hours.oldest
          ? `The oldest has been waiting since ${dateOnly(hours.oldest)}. Teachers approve them in the app.`
          : hours.at
          ? `Read from the JOC App on ${dateOnly(hours.at)}. Teachers approve them in the app.`
          : "Nobody has recorded when this was last read from the app.",
        action: { label: "Open the app", href: "/school/activity" },
      });
    }

    // 2. The next run. A date, not a problem — so never orange.
    const next = events[0];
    if (next) {
      rows.push({
        id: `run-${next.id}`,
        kind: "NEXT_RUN",
        label: "Next run",
        figure: day(next.startsAt),
        word: true,
        tone: "info",
        weight: 80,
        title: next.title,
        line: [next.location, next.audience].filter(Boolean).join(" · ") || "At your school.",
        action: next.program
          ? { label: "See the plan", href: `/school/programs/${next.program.slug}` }
          : undefined,
      });
    }

    // 3. Where a program being set up has got to. One row, for the program
    //    furthest along, because four of these is a to-do list nobody reads.
    const inSetup = enrollments
      .filter((e) => SETUP.includes(e.stage as Stage))
      .sort((a, b) => stepFor(b.stage as Stage) - stepFor(a.stage as Stage));

    const step = inSetup[0];
    if (step) {
      const n = stepFor(step.stage as Stage);
      rows.push({
        id: `step-${step.program.slug}`,
        kind: "NEXT_STEP",
        label: "Your next step",
        figure: STEP_TITLE[n],
        word: true,
        // The only other orange candidate. It loses to unapproved hours,
        // which is stripped below, so the page never carries two.
        tone: "warn",
        weight: 70,
        title: step.program.name,
        line: `${STAGE_LABEL[step.stage as Stage]} since ${dateOnly(step.stageSince)}.`,
        action: { label: "See where it's up to", href: `/school/programs/${step.program.slug}` },
      });
    }

    // 4. Write-ups nobody has read. Only for a teacher who supervises them.
    if (unread > 0) {
      rows.push({
        id: "write-ups",
        kind: "NEW_WRITE_UP",
        label: "New write-up",
        figure: String(unread),
        tone: "info",
        weight: 60,
        title: `Write-up${unread === 1 ? "" : "s"} from your ambassadors`,
        line: `Nobody has read ${unread === 1 ? "it" : "them"} yet.`,
        action: { label: "Read them", href: "/school/ambassadors" },
      });
    }

    // 5. A reply, in the coordinator's own words and nobody else's.
    for (const r of replies) {
      // The band carries a name because a reply comes from a person. Where we
      // have not got one, "JOC" is honest; "Somebody" reads as evasive.
      const named = r.answeredBy?.name ?? r.answeredBy?.email ?? null;
      rows.push({
        id: `reply-${r.id}`,
        kind: "REPLY",
        label: "Reply from JOC",
        figure: named ? named.split(/\s+/)[0] : "JOC",
        word: true,
        tone: "good",
        weight: 50,
        title: r.program ? `About ${r.program.name}` : "About what you asked",
        line: r.reply ?? "",
        action: r.program
          ? { label: `Open ${r.program.name}`, href: `/school/programs/${r.program.slug}` }
          : undefined,
      });
    }

    rows.sort((a, b) => b.weight - a.weight);

    // At most one solid orange. Anything else that wanted it becomes the
    // quieter tint, which still reads as ours to do without shouting.
    let usedOrange = false;
    for (const r of rows) {
      if (r.tone !== "warn") continue;
      if (usedOrange) r.tone = "quiet";
      usedOrange = true;
    }

    const reported = new Set(reportCounts.map((c) => c.ambassadorId));

    const programs = enrollments
      .map((e) => ({
        id: e.program.id,
        slug: e.program.slug,
        name: e.program.name,
        heroColor: e.program.heroColor,
        stage: e.stage as Stage,
        step: stepFor(e.stage as Stage),
        since: e.stageSince,
        headline: headlineFor(e.stage as Stage, reported.size),
      }))
      .sort((a, b) => b.step - a.step || a.name.localeCompare(b.name));

    return { rows, programs };
  } catch {
    return EMPTY;
  }
}

/**
 * One line of what is true of this program at this school, or null.
 *
 * Null renders as a sentence saying what is not recorded yet, in orange. It
 * never renders as a nought, because a nought here would be a claim we
 * cannot make.
 */
function headlineFor(stage: Stage, reports: number): string | null {
  if (SETUP.includes(stage)) return null;
  if (reports > 0) {
    return `${reports} ambassador${reports === 1 ? " has" : "s have"} written something up.`;
  }
  return null;
}
