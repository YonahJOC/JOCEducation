import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { CyclesClient, type CycleRow } from "./CyclesClient";
import { CyclesGuard } from "@/components/admin/Guard";
import { ConsoleHeader } from "@/components/admin/ProgramConsoleHeader";
import { BandRow } from "@/components/ui/BandRow";
import { getCycleToday, type CycleSummary } from "@/lib/cycle-today";
import { heroFg } from "@/lib/hero-color";
import { C, F, label, datum, rowCard, sectionHeading, CONTENT_MAX } from "@/lib/joc-tokens";

/**
 * The Chesed Cycles console.
 *
 * The Cycles had an editor and nothing else: eight forms, and no page that
 * said whether any of it was landing. Meanwhile every one of the eight
 * programs got a console with a Today tab telling its coordinator what needed
 * them. The thing the whole network is on all year had the least.
 *
 * So it is a console now, built the same way as the others — the same band,
 * the same tabs, the same worst-first Today list. The editor is one tab
 * rather than the first thing on the page, which is the same change the
 * program consoles made when the form builder stopped being the front door.
 */

export const metadata = { title: "Chesed Cycles — JOC Console" };
export const dynamic = "force-dynamic";

/** The Cycles' own colour, the way each program has one. */
const HERO = "#2D46AF";

type Tab = "today" | "cycles" | "schools" | "lessons";
const TABS: Tab[] = ["today", "cycles", "schools", "lessons"];

const TAB_LABEL: Record<Tab, string> = {
  today: "Today",
  cycles: "The cycles",
  schools: "Schools",
  lessons: "Lessons",
};

const iso = (d: Date) => new Date(d).toISOString().slice(0, 10);

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

async function getCycleRows(): Promise<CycleRow[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const [rows, lessonCounts] = await Promise.all([
      prisma.cycle.findMany({
        orderBy: { num: "asc" },
        include: { weekPlan: { orderBy: { order: "asc" } } },
      }),
      prisma.lessonPlan.groupBy({
        by: ["cycleSlug"],
        where: { published: true },
        _count: { _all: true },
      }),
    ]);

    const counts = new Map(
      lessonCounts
        .filter((c) => c.cycleSlug)
        .map((c) => [c.cycleSlug as string, c._count._all]),
    );

    return rows.map((c) => ({
      id: c.id,
      num: c.num,
      slug: c.slug,
      theme: c.theme,
      gloss: c.gloss,
      question: c.question,
      hebrew: c.hebrew,
      anchor: c.anchor,
      range: c.range,
      startDate: iso(c.startDate),
      endDate: iso(c.endDate),
      weeks: c.weeks,
      color: c.color,
      tags: c.tags ?? [],
      desc: c.desc,
      focus: c.focus.length > 0 ? c.focus : [""],
      weekPlan: c.weekPlan.length > 0
        ? c.weekPlan.map((w) => ({ title: w.title, body: w.body }))
        : [{ title: "", body: "" }],
      lessonCount: counts.get(c.slug) ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * How each school is going, without naming a school to anybody who should not
 * see it — the console is JOC's own, so here they are named, and the figure
 * is teachers who saved something rather than anything about students.
 */
async function getSchoolRows() {
  if (!isDatabaseConfigured()) return [];
  try {
    const [schools, saves] = await Promise.all([
      prisma.school.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, _count: { select: { members: true } } },
      }),
      prisma.savedLesson.findMany({
        select: {
          userId: true,
          user: { select: { schoolId: true } },
          lesson: { select: { cycleSlug: true } },
        },
      }),
    ]);

    const bySchool = new Map<string, Set<string>>();
    const cyclesBySchool = new Map<string, Set<string>>();
    for (const s of saves) {
      const id = s.user.schoolId;
      if (!id) continue;
      if (!bySchool.has(id)) bySchool.set(id, new Set());
      bySchool.get(id)!.add(s.userId);
      if (s.lesson.cycleSlug) {
        if (!cyclesBySchool.has(id)) cyclesBySchool.set(id, new Set());
        cyclesBySchool.get(id)!.add(s.lesson.cycleSlug);
      }
    }

    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      staff: s._count.members,
      teachers: bySchool.get(s.id)?.size ?? 0,
      cycles: cyclesBySchool.get(s.id)?.size ?? 0,
    }));
  } catch {
    return [];
  }
}

export default async function AdminCyclesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: asked } = await searchParams;
  const tab: Tab = TABS.includes(asked as Tab) ? (asked as Tab) : "today";

  return <CyclesGuard>{await Inner(tab)}</CyclesGuard>;
}

async function Inner(tab: Tab) {
  const [today, cycles, schools] = await Promise.all([
    getCycleToday(),
    tab === "cycles" ? getCycleRows() : Promise.resolve([]),
    tab === "schools" ? getSchoolRows() : Promise.resolve([]),
  ]);

  const running = today.running;
  const withLessons = today.cycles.filter((c) => c.lessons > 0).length;

  const counts = [
    running ? `CYCLE ${running.num} RUNNING · ${running.theme.toUpperCase()}` : "NOTHING RUNNING",
    `${withLessons} OF ${today.cycles.length} WITH LESSONS`,
    running ? `ENDS ${day(running.endDate).toUpperCase()}` : "NO DATES AHEAD",
  ].join(" · ");

  return (
    <>
      <div className="joc-bleed">
        <ConsoleHeader
          eyebrow="Program console · year-round · every school is on it"
          name="Chesed Cycles"
          counts={counts}
          heroColor={HERO}
          fg={heroFg(HERO)}
          basePath="/admin/cycles"
          tabs={TABS.map((t) => ({
            key: t,
            label: TAB_LABEL[t],
            count:
              t === "today" ? today.rows.length
              : t === "cycles" ? today.cycles.length
              : undefined,
          }))}
          active={tab}
        />
      </div>

      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "24px 0 48px" }}>
        {tab === "today" && <Today today={today} />}

        {tab === "cycles" && (
          <CyclesClient
            cycles={cycles}
            usingStatic={cycles.length === 0}
            disabled={!isDatabaseConfigured()}
          />
        )}

        {tab === "schools" && <Schools rows={schools} />}

        {tab === "lessons" && <Lessons cycles={today.cycles} />}
      </div>
    </>
  );
}

function Today({ today }: { today: Awaited<ReturnType<typeof getCycleToday>> }) {
  return (
    <div>
      <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Needs you</h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 16px", maxWidth: "60ch" }}>
        Worst first. Every row is true right now and stops appearing when it stops being true.
      </p>

      {today.rows.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px", marginBottom: "28px" }}>
          <p style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.greenText, margin: "0 0 6px" }}>
            Nothing needs you today
          </p>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: 0, maxWidth: "56ch" }}>
            A cycle is running, it has lessons against it, and somebody has opened them.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginBottom: "28px" }}>
          {today.rows.map((r) => (
            <BandRow
              key={r.id}
              tone={r.tone}
              label={r.label}
              figure={r.figure}
              word={r.word}
              title={r.title}
              line={r.line}
              action={r.action}
            />
          ))}
        </div>
      )}

      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>The year</h2>
      <Chain cycles={today.cycles} />
    </div>
  );
}

/**
 * The eight, in order, as one chain.
 *
 * They are one contiguous run rather than eight independent date pairs, so
 * they are drawn as a chain: the running one is what this year is, and the
 * two either side of it are where it came from and where it goes.
 */
function Chain({ cycles }: { cycles: CycleSummary[] }) {
  if (cycles.length === 0) {
    return (
      <p style={{ fontFamily: F.read, fontSize: "16px", color: C.orangeText, lineHeight: 1.55, margin: 0, maxWidth: "58ch" }}>
        No cycle is set up. Until the dates are in, the site cannot tell a school what it is on.
      </p>
    );
  }

  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "8px" }}>
      {cycles.map((c) => {
        const now = c.state === "current";
        return (
          <li
            key={c.slug}
            style={{
              ...rowCard,
              padding: "14px 18px",
              border: now ? `2px solid ${C.orange}` : undefined,
              boxShadow: c.state === "past" ? "none" : undefined,
              opacity: c.state === "past" ? 0.72 : 1,
              display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "6px", alignSelf: "stretch", minHeight: "36px",
                borderRadius: "3px", backgroundColor: c.color,
              }}
            />

            <span style={{ ...datum, color: now ? C.orangeText : C.muted, minWidth: "72px" }}>
              {now ? "RUNNING" : c.state === "past" ? "DONE" : `0${c.num}`}
            </span>

            <span style={{ flex: 1, minWidth: "190px" }}>
              <span style={{
                display: "block", fontFamily: F.ui, fontSize: "17px",
                fontWeight: now ? 700 : 600, color: C.ink, letterSpacing: "-0.01em",
              }}>
                {c.theme}
              </span>
              <span style={{ ...datum, display: "block", marginTop: "2px" }}>
                {day(c.startDate).toUpperCase()} — {day(c.endDate).toUpperCase()}
              </span>
            </span>

            <span style={{
              fontFamily: F.read, fontSize: "15px", lineHeight: 1.45,
              color: c.lessons > 0 ? C.muted : C.orangeText, minWidth: "170px",
            }}>
              {c.lessons > 0
                ? `${c.lessons} lesson${c.lessons === 1 ? "" : "s"} · ${
                    c.teachers > 0
                      ? `${c.teachers} teacher${c.teachers === 1 ? "" : "s"} saved one`
                      : "nobody has opened them"
                  }`
                : "Nothing published against it"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Schools({
  rows,
}: {
  rows: { id: string; name: string; staff: number; teachers: number; cycles: number }[];
}) {
  if (rows.length === 0) {
    return (
      <p style={{ fontFamily: F.read, fontSize: "16px", color: C.orangeText, margin: 0 }}>
        No school is recorded yet.
      </p>
    );
  }

  // Quietest first: a school where nothing is happening is the one somebody
  // can do something about.
  const sorted = [...rows].sort((a, b) => a.teachers - b.teachers || a.name.localeCompare(b.name));

  // Thirty-nine identical rows is a wall, not a list. The same twelve-then-
  // show-all the Schools tab uses on a program console.
  const first = sorted.slice(0, SHOWN);
  const rest = sorted.slice(SHOWN);

  const started = sorted.filter((s) => s.teachers > 0).length;

  return (
    <div>
      <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Schools</h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 16px", maxWidth: "60ch" }}>
        Teachers who have saved a lesson, by school. Quietest first. Nothing here is about a
        student.{" "}
        {started === 0
          ? "No teacher at any school has saved one yet."
          : `${started} of ${sorted.length} schools have somebody who has.`}
      </p>

      <div style={{ display: "grid", gap: "10px" }}>
        {first.map((s) => <SchoolRow key={s.id} s={s} />)}
      </div>

      {rest.length > 0 && (
        <details style={{ marginTop: "10px" }}>
          <summary style={{
            fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.blue,
            cursor: "pointer", minHeight: "44px", display: "flex", alignItems: "center",
          }}>
            Show all {sorted.length}
          </summary>
          <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
            {rest.map((s) => <SchoolRow key={s.id} s={s} />)}
          </div>
        </details>
      )}
    </div>
  );
}

/** How many rows before the rest go behind "Show all". */
const SHOWN = 12;

function SchoolRow({
  s,
}: {
  s: { id: string; name: string; staff: number; teachers: number; cycles: number };
}) {
  return (
    <BandRow
      tone={s.teachers === 0 ? "quiet" : s.cycles > 1 ? "good" : "info"}
      label={s.teachers === 0 ? "Nobody yet" : "Teachers"}
      figure={s.teachers === 0 ? "None" : String(s.teachers)}
      word={s.teachers === 0}
      title={s.name}
      line={
        s.teachers === 0
          ? s.staff > 0
            ? `${s.staff} ${s.staff === 1 ? "person has" : "people have"} a login and none of them has saved a lesson.`
            : "Nobody at this school has a login yet."
          : `Across ${s.cycles} cycle${s.cycles === 1 ? "" : "s"}, out of ${s.staff} with a login.`
      }
      action={{ label: "Open the school", href: "/admin/schools" }}
    />
  );
}

function Lessons({ cycles }: { cycles: CycleSummary[] }) {
  const empty = cycles.filter((c) => c.lessons === 0);

  return (
    <div>
      <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Lessons, by cycle</h2>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 16px", maxWidth: "60ch" }}>
        What is published against each cycle, and whether anybody has opened it.
      </p>

      {empty.length > 0 && (
        <p style={{
          ...rowCard, padding: "16px 18px", marginBottom: "16px",
          fontFamily: F.read, fontSize: "16px", lineHeight: 1.55, color: C.orangeText,
          maxWidth: "62ch",
        }}>
          {empty.length === cycles.length
            ? "Nothing is published against any cycle. A teacher who opens one finds an empty page."
            : `${empty.length} of the ${cycles.length} cycles have nothing published against them: ${empty
                .map((c) => `Cycle ${c.num}`)
                .join(", ")}.`}
        </p>
      )}

      <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
        {cycles.map((c) => (
          <BandRow
            key={c.slug}
            tone={c.lessons === 0 ? "warn" : c.teachers === 0 ? "info" : "good"}
            label={`Cycle 0${c.num}`}
            figure={c.lessons === 0 ? "None" : String(c.lessons)}
            word={c.lessons === 0}
            title={c.theme}
            line={
              c.lessons === 0
                ? "Nothing is published against it."
                : c.teachers === 0
                ? `${c.lessons} published, and no teacher anywhere has saved one.`
                : `${c.lessons} published · ${c.teachers} teacher${c.teachers === 1 ? " has" : "s have"} saved one.`
            }
          />
        ))}
      </div>

      <p style={{ ...label, color: C.muted, margin: 0 }}>
        <Link href="/admin/lessons" style={{ color: C.blue }}>Open the lesson library</Link>
      </p>
    </div>
  );
}
