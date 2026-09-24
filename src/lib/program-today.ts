import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { STAGE_TONE, STAGE_LABEL, type Stage } from "@/lib/program-enrollment";
import type { Tone } from "@/lib/joc-tokens";

/**
 * What needs a program coordinator today.
 *
 * The console could show everything about a program and nothing about what to
 * do with it. This is the one list that answers "I have twenty minutes, what
 * should I look at" — worst first, each row a sentence and one action.
 *
 * Every row is a thing that has been true for too long. Nothing here is a
 * notification: it is all derived from the state of the program, so a row
 * that stops being true simply stops appearing.
 */

/** A setup stage sat at for longer than this is stuck. Shared with ProgramSchools. */
export const STUCK_DAYS = 45;

/** A past run with nothing written up after this many days is a gap in the record. */
const WRITE_UP_DAYS = 5;

/** A run happening inside this window that nobody has announced. */
const SOON_DAYS = 14;

export type TodayKind =
  | "STUCK"
  | "NEW_SIGN_UP"
  | "NO_WRITE_UP"
  | "DECIDED"
  | "UNANNOUNCED"
  | "ASKED";

export type TodayRow = {
  id: string;
  kind: TodayKind;
  /** Above the figure: "STUCK". */
  label: string;
  /** The figure: "61 days", "3". */
  figure: string;
  tone: Tone;
  /** How bad, for sorting. Higher first. */
  weight: number;
  schoolId: string | null;
  /** The thing itself — nearly always a school. */
  title: string;
  /** One line, around ninety characters. */
  line: string;
  action: { label: string; href: string };
  /** The SchoolActivity this row is, for the rows a coordinator can answer. */
  askId?: string;
};

export type ProgramToday = {
  rows: TodayRow[];
  /** The next few runs, for the right-hand column. */
  comingUp: {
    id: number;
    title: string;
    schoolName: string | null;
    startsAt: Date;
    published: boolean;
  }[];
  /** True once the ambassador tables have something in them for this program. */
  reportsExpected: boolean;
};

const days = (from: Date, now: number) => Math.floor((now - from.getTime()) / 86_400_000);

const EMPTY: ProgramToday = { rows: [], comingUp: [], reportsExpected: false };

export async function getProgramToday(programId: number, slug: string): Promise<ProgramToday> {
  if (!isDatabaseConfigured()) return EMPTY;

  try {
    const now = Date.now();
    const rows: TodayRow[] = [];

    const [enrollments, program, events, ambassadors] = await Promise.all([
      prisma.programEnrollment.findMany({
        where: { programId },
        select: {
          stage: true, stageSince: true,
          school: { select: { id: true, name: true } },
        },
      }),
      prisma.programPage.findUnique({
        where: { id: programId },
        select: { formId: true, name: true },
      }),
      prisma.programEvent.findMany({
        where: { programId, status: { not: "CANCELLED" } },
        orderBy: { startsAt: "asc" },
        select: {
          id: true, title: true, startsAt: true, published: true, status: true,
          school: { select: { id: true, name: true } },
        },
      }),
      prisma.programAmbassador.count({ where: { programId } }),
    ]);

    // ── A school asked something and nobody has answered ───────────────────
    // Top of the list. Everything else here is a thing that has gone quiet;
    // this is a person waiting, and a person waiting outranks a process.
    const asks = await prisma.schoolActivity.findMany({
      where: { programId, inbound: true, answeredAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, topic: true, detail: true, createdAt: true,
        school: { select: { id: true, name: true } },
      },
    });

    for (const a of asks) {
      const age = days(a.createdAt, now);
      rows.push({
        id: `ask:${a.id}`,
        kind: "ASKED",
        label: `Asked · ${a.topic ?? "something"}`,
        figure: age === 0 ? "today" : `${age} day${age === 1 ? "" : "s"}`,
        tone: "info",
        weight: 2000 + age,
        schoolId: a.school.id,
        title: a.school.name,
        line: (a.detail ?? "").slice(0, 160) || "They left no detail.",
        action: { label: "Mark it answered", href: `/admin/programs/${slug}` },
        askId: a.id,
      });
    }

    // ── Stuck: a school that has sat in the same setup stage too long ──────
    for (const e of enrollments) {
      const stage = e.stage as Stage;
      if (STAGE_TONE[stage] !== "setup") continue;
      const age = days(e.stageSince, now);
      if (age <= STUCK_DAYS) continue;

      rows.push({
        id: `stuck:${e.school.id}`,
        kind: "STUCK",
        label: "Stuck",
        figure: `${age} days`,
        tone: "warn",
        weight: 1000 + age,
        schoolId: e.school.id,
        title: e.school.name,
        line: `At ${STAGE_LABEL[stage].toLowerCase()} since ${e.stageSince.toLocaleDateString("en-US", { day: "numeric", month: "short" })}.`,
        action: { label: "Move it on", href: `/admin/programs/${slug}?tab=schools` },
      });
    }

    // ── A sign-up from a school nobody has picked up ───────────────────────
    if (program?.formId) {
      const responses = await prisma.formResponse.findMany({
        where: { formId: program.formId, schoolId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, school: { select: { id: true, name: true } } },
      });

      const stageOf = new Map(enrollments.map((e) => [e.school.id, e.stage as Stage]));
      const seen = new Set<string>();

      for (const r of responses) {
        if (!r.school || seen.has(r.school.id)) continue;
        const stage = stageOf.get(r.school.id);
        // Registered or beyond means somebody has already acted on it.
        if (stage && stage !== "INTRODUCED") continue;
        seen.add(r.school.id);

        const age = days(r.createdAt, now);
        rows.push({
          id: `signup:${r.id}`,
          kind: "NEW_SIGN_UP",
          label: "New sign-up",
          figure: age === 0 ? "Today" : `${age} days`,
          tone: "info",
          weight: 2000 + age,
          schoolId: r.school.id,
          title: r.school.name,
          line: `Filled in the form, still down as ${stage ? STAGE_LABEL[stage].toLowerCase() : "not started"}.`,
          action: { label: "Open the sign-ups", href: `/admin/programs/${slug}?tab=sign-ups` },
        });
      }
    }

    // ── A run that happened and nobody wrote up ────────────────────────────
    // Only once this program has ambassadors. Before that the absence of a
    // write-up says nothing about the program, only about the platform.
    if (ambassadors > 0) {
      const past = events.filter((e) => e.startsAt.getTime() < now);
      if (past.length > 0) {
        const reported = new Set(
          (
            await prisma.eventReport.findMany({
              where: { eventId: { in: past.map((e) => e.id) } },
              select: { eventId: true },
            })
          ).map((r) => r.eventId),
        );

        for (const e of past) {
          if (reported.has(e.id)) continue;
          const age = days(e.startsAt, now);
          if (age < WRITE_UP_DAYS) continue;

          rows.push({
            id: `writeup:${e.id}`,
            kind: "NO_WRITE_UP",
            label: "No write-up",
            figure: `${age} days`,
            tone: "warn",
            weight: 700 + age,
            schoolId: e.school?.id ?? null,
            title: e.school?.name ?? e.title,
            line: `${e.title} ran and no ambassador has written it up.`,
            action: { label: "See the reports", href: `/admin/programs/${slug}?tab=today` },
          });
        }
      }
    }

    // ── Something the admin meeting decided ────────────────────────────────
    const decided = await prisma.adminMeetingItem.findMany({
      where: { programId, outcome: { not: null }, outcomeAt: { not: null } },
      orderBy: { outcomeAt: "desc" },
      take: 5,
      select: {
        id: true, outcome: true, outcomeAt: true, outcomeNote: true,
        school: { select: { id: true, name: true } },
      },
    });

    for (const d of decided) {
      if (!d.outcomeAt) continue;
      const age = days(d.outcomeAt, now);
      // A decision older than a fortnight has been seen or never will be.
      if (age > 14) continue;

      rows.push({
        id: `decided:${d.id}`,
        kind: "DECIDED",
        label: "Decided",
        figure: d.outcomeAt.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        tone: "good",
        weight: 1500 - age,
        schoolId: d.school.id,
        title: d.school.name,
        line: d.outcomeNote ?? "The admin meeting settled it.",
        action: { label: "See the light", href: `/admin/programs/${slug}?tab=schools` },
      });
    }

    // ── A run happening soon that nobody has announced ─────────────────────
    const soon = new Date(now + SOON_DAYS * 86_400_000);
    for (const e of events) {
      if (e.published) continue;
      if (e.startsAt.getTime() < now || e.startsAt > soon) continue;
      const until = Math.ceil((e.startsAt.getTime() - now) / 86_400_000);

      rows.push({
        id: `unannounced:${e.id}`,
        kind: "UNANNOUNCED",
        label: "Not announced",
        figure: `${until} day${until === 1 ? "" : "s"}`,
        tone: "warn",
        weight: 1800 - until,
        schoolId: e.school?.id ?? null,
        title: e.school?.name ?? e.title,
        line: `${e.title} is still unpublished, so nobody outside can see it.`,
        action: { label: "Open the calendar", href: "/admin/programming" },
      });
    }

    rows.sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title));

    // Solid orange belongs to one row on a screen. The heaviest earns it.
    if (rows[0] && rows[0].tone === "warn") rows[0].tone = "urgent";

    return {
      rows,
      comingUp: events
        .filter((e) => e.startsAt.getTime() >= now)
        .slice(0, 5)
        .map((e) => ({
          id: e.id,
          title: e.title,
          schoolName: e.school?.name ?? null,
          startsAt: e.startsAt,
          published: e.published,
        })),
      reportsExpected: ambassadors > 0,
    };
  } catch {
    return EMPTY;
  }
}

/** How many rows need somebody, for the card on /admin/my-programs. */
export async function needCount(programId: number, slug: string): Promise<number> {
  const today = await getProgramToday(programId, slug);
  return today.rows.length;
}
