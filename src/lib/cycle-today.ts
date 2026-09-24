import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import type { Tone } from "@/lib/joc-tokens";

/**
 * What needs the person running the Chesed Cycles.
 *
 * The Cycles are not one of the eight programs — no ProgramPage row describes
 * them, no school enrols in them, and nobody pays for them. They are the
 * thing the whole network is on all year, which is why they never had a
 * console: there was an editor for the eight cycles and nowhere that said
 * whether any of it was working.
 *
 * Every row here is a thing that is true right now and stops appearing when
 * it stops being true. Nothing is a notification and nothing is dismissed.
 *
 * The one rule this shares with the school side: a cycle with no lessons is
 * said in words, never as a nought. "0 lessons" reads as a measurement; it is
 * actually a gap in what JOC has published.
 */

/** A cycle starting inside this window is close enough that empty matters. */
const SOON_DAYS = 21;

/** The running cycle ending inside this window, with the next one empty. */
const ENDING_DAYS = 14;

export type CycleTodayKind =
  | "NO_LESSONS"
  | "NEXT_EMPTY"
  | "NOTHING_RUNNING"
  | "NOBODY_OPENED"
  | "GAP";

export type CycleTodayRow = {
  id: string;
  kind: CycleTodayKind;
  label: string;
  figure: string;
  word?: boolean;
  tone: Tone;
  weight: number;
  title: string;
  line: string;
  action?: { label: string; href: string };
};

export type CycleSummary = {
  id: number;
  num: number;
  slug: string;
  theme: string;
  color: string;
  startDate: Date;
  endDate: Date;
  state: "past" | "current" | "upcoming";
  /** Published lesson plans tied to this cycle. */
  lessons: number;
  /** Teachers, anywhere in the network, who have saved one of them. */
  teachers: number;
};

export type CycleToday = {
  rows: CycleTodayRow[];
  cycles: CycleSummary[];
  /** The one running now, if any. */
  running: CycleSummary | null;
};

const EMPTY: CycleToday = { rows: [], cycles: [], running: null };

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const shortDay = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

const daysBetween = (a: Date, b: number) => Math.round((a.getTime() - b) / 86_400_000);

export async function getCycleToday(): Promise<CycleToday> {
  if (!isDatabaseConfigured()) return EMPTY;

  try {
    const now = Date.now();

    const [cycles, lessons, saves] = await Promise.all([
      prisma.cycle.findMany({
        orderBy: { num: "asc" },
        select: {
          id: true, num: true, slug: true, theme: true, color: true,
          startDate: true, endDate: true,
        },
      }),
      prisma.lessonPlan.groupBy({
        by: ["cycleSlug"],
        where: { published: true, cycleSlug: { not: null } },
        _count: { _all: true },
      }),
      prisma.savedLesson.findMany({
        select: { userId: true, lesson: { select: { cycleSlug: true } } },
      }),
    ]);

    const lessonCount = new Map(lessons.map((l) => [l.cycleSlug ?? "", l._count._all]));

    // Distinct teachers per cycle, across the network. A save is the only
    // evidence we have that anybody opened a cycle's material.
    const byCycle = new Map<string, Set<string>>();
    for (const s of saves) {
      const slug = s.lesson.cycleSlug;
      if (!slug) continue;
      if (!byCycle.has(slug)) byCycle.set(slug, new Set());
      byCycle.get(slug)!.add(s.userId);
    }

    const summaries: CycleSummary[] = cycles.map((c) => ({
      ...c,
      state:
        c.endDate.getTime() < now ? "past" : c.startDate.getTime() > now ? "upcoming" : "current",
      lessons: lessonCount.get(c.slug) ?? 0,
      teachers: byCycle.get(c.slug)?.size ?? 0,
    }));

    const running = summaries.find((c) => c.state === "current") ?? null;
    const rows: CycleTodayRow[] = [];

    // ── Nothing is running ─────────────────────────────────────────────────
    // Either the year has not been set up or today has fallen into a gap
    // between two cycles. Both are the same thing to a school: they open the
    // site and it cannot tell them what the school is on.
    if (!running && summaries.length > 0) {
      const next = summaries.find((c) => c.state === "upcoming") ?? null;
      const last = [...summaries].reverse().find((c) => c.state === "past") ?? null;

      rows.push({
        id: "nothing-running",
        kind: next && last ? "GAP" : "NOTHING_RUNNING",
        label: next && last ? "Gap" : "Nothing running",
        figure: next ? shortDay(next.startDate) : "No dates",
        word: true,
        tone: "warn",
        weight: 1000,
        title: next && last
          ? `Nothing runs between ${day(last.endDate)} and ${day(next.startDate)}`
          : "No cycle is running today",
        line: next
          ? `Cycle ${next.num}, ${next.theme}, starts ${day(next.startDate)}. Until then the site cannot tell a school what it is on.`
          : "Every cycle has finished and none is dated ahead. Set this year's dates.",
        action: { label: "Open the dates", href: "/admin/cycles?tab=cycles" },
      });
    }

    // ── The running cycle has nothing to teach ─────────────────────────────
    if (running && running.lessons === 0) {
      rows.push({
        id: `no-lessons-${running.slug}`,
        kind: "NO_LESSONS",
        label: "Running now",
        figure: "No lessons",
        word: true,
        tone: "warn",
        weight: 900,
        title: `Cycle ${running.num} · ${running.theme}`,
        line: `It is running until ${day(running.endDate)} and nothing is published against it, so a teacher who opens it finds an empty page.`,
        action: { label: "Open the lesson library", href: "/admin/lessons" },
      });
    }

    // ── The next one starts soon and is empty ──────────────────────────────
    const next = summaries.find((c) => c.state === "upcoming") ?? null;
    if (next && next.lessons === 0) {
      const away = daysBetween(next.startDate, now);
      if (away <= SOON_DAYS) {
        rows.push({
          id: `next-empty-${next.slug}`,
          kind: "NEXT_EMPTY",
          label: "Starts soon",
          figure: away <= 0 ? "today" : `${away} day${away === 1 ? "" : "s"}`,
          word: away <= 0,
          tone: "warn",
          weight: 800 - away,
          title: `Cycle ${next.num} · ${next.theme}`,
          line: `It begins ${day(next.startDate)} with nothing published against it yet.`,
          action: { label: "Open the lesson library", href: "/admin/lessons" },
        });
      }
    }

    // ── The running cycle ends soon and the next has nothing ───────────────
    if (running && next && next.lessons > 0) {
      const left = daysBetween(running.endDate, now);
      if (left <= ENDING_DAYS) {
        rows.push({
          id: `ending-${running.slug}`,
          kind: "NEXT_EMPTY",
          label: "Ends in",
          figure: left <= 0 ? "today" : `${left} day${left === 1 ? "" : "s"}`,
          word: left <= 0,
          tone: "info",
          weight: 500,
          title: `Cycle ${next.num}, ${next.theme}, is next`,
          line: `Cycle ${running.num} ends ${day(running.endDate)}. ${next.lessons} lesson${next.lessons === 1 ? " is" : "s are"} ready for what follows.`,
          action: { label: "See the cycles", href: "/admin/cycles?tab=cycles" },
        });
      }
    }

    // ── Published, and nobody has opened it ────────────────────────────────
    if (running && running.lessons > 0 && running.teachers === 0) {
      rows.push({
        id: `unopened-${running.slug}`,
        kind: "NOBODY_OPENED",
        label: "Nobody opened it",
        figure: `${running.lessons} up`,
        word: true,
        tone: "info",
        weight: 400,
        title: `Cycle ${running.num} · ${running.theme}`,
        line: `${running.lessons} lesson${running.lessons === 1 ? " is" : "s are"} published and no teacher anywhere has saved one.`,
        action: { label: "See how schools are doing", href: "/admin/cycles?tab=schools" },
      });
    }

    rows.sort((a, b) => b.weight - a.weight);

    // One solid orange, as everywhere else a person is being told something
    // is their problem.
    let orange = false;
    for (const r of rows) {
      if (r.tone !== "warn") continue;
      if (orange) r.tone = "quiet";
      orange = true;
    }

    return { rows, cycles: summaries, running };
  } catch {
    return EMPTY;
  }
}
