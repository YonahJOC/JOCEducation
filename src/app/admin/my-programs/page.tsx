import Link from "next/link";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { listProgramsForAdmin } from "@/lib/program-admin";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getProgramToday } from "@/lib/program-today";
import { schoolsInProgram } from "@/lib/program-enrollment";
import { C, rowCard, label, datum, F, pageTitle } from "@/lib/joc-tokens";
import { BandRow } from "@/components/ui/BandRow";
import { programStatus } from "@/lib/program-status";
import { getCycleToday } from "@/lib/cycle-today";
import { can as canDo } from "@/lib/access";

/**
 * Every program console, as cards (2a).
 *
 * This was a list of names. Somebody opening it wanted to know which of the
 * eight needed them, and a list of names cannot say — so they opened all
 * eight. The card's figure is the point, and the cards are sorted by it.
 *
 * It is not the Programs page: that one edits the public write-up and belongs
 * to the education team. This is the programs somebody actually runs.
 *
 * No capability guard — being named as running a program is the permission,
 * and listProgramsForAdmin already narrows the list to that person's own.
 */

export const metadata = { title: "Program consoles — JOC Console" };
export const dynamic = "force-dynamic";

/** Ink reads as an error or a disabled state in a 6px strip. */
const strip = (hero: string) => (hero.toUpperCase() === C.ink.toUpperCase() ? C.blue : hero);

export default async function MyProgramsPage() {
  const programs = await listProgramsForAdmin();
  const session = await safeAuth();

  // An admin sees every program here; a coordinator sees only theirs. The
  // wording follows, so the page never calls somebody else's programs "yours".
  const all =
    openForReview ||
    can(session?.user, "programs") ||
    can(session?.user, "forms") ||
    can(session?.user, "coordinators");

  const canAssign = openForReview || can(session?.user, "coordinators");

  const [schoolCount, onTheApp] = isDatabaseConfigured()
    ? await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { appSchoolId: { not: null } } }),
      ])
    : [0, 0];

  // The Chesed Cycles are the ninth console on this page and the only one
  // with no ProgramPage row: no school enrols, nobody pays, and every school
  // is on it all year. It was reachable only from the teaching-material hub,
  // which is where it lived when it was an editor rather than a console.
  const cycles = openForReview || canDo(session?.user, "cycles")
    ? await getCycleToday()
    : null;

  const cards = await Promise.all(
    programs.map(async (p) => {
      const [today, inIt, booked] = await Promise.all([
        getProgramToday(p.id, p.slug),
        schoolsInProgram(p.id),
        isDatabaseConfigured()
          ? prisma.programEvent.count({
              where: { programId: p.id, status: { not: "CANCELLED" }, startsAt: { gte: new Date() } },
            })
          : Promise.resolve(0),
      ]);

      const nextRun = today.comingUp[0]?.startsAt ?? null;

      return {
        ...p,
        need: today.rows.length,
        // A program with no sign-up form cannot be asked how many sign-ups are
        // waiting, so its nought is a partial answer rather than a clear one.
        needKnown: Boolean(p.formTitle),
        inCount: inIt.size,
        nextRun,
        status: programStatus({
          tag: p.tag, slug: p.slug, inCount: inIt.size,
          schoolCount, booked, nextRun, onTheApp,
        }),
      };
    }),
  );

  // Most need first, then whatever happens soonest, then by name.
  cards.sort(
    (a, b) =>
      b.need - a.need ||
      (a.nextRun?.getTime() ?? Infinity) - (b.nextRun?.getTime() ?? Infinity) ||
      a.name.localeCompare(b.name),
  );

  const unled = cards.filter((c) => !c.lead);
  const needing = cards.filter((c) => c.need > 0).length + (cycles && cycles.rows.length > 0 ? 1 : 0);

  const cycleCard = cycles
    ? {
        need: cycles.rows.length,
        running: cycles.running,
        withLessons: cycles.cycles.filter((c) => c.lessons > 0).length,
        total: cycles.cycles.length,
      }
    : null;

  return (
    <div>
      {/* The title, with the rest of the section beside it rather than as a
          row of pills underneath that read like filters. */}
      <div className="joc-page-head">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...pageTitle, margin: "0 0 6px" }}>
            {all ? "Program consoles" : "Your programs"}
          </h1>
          <p style={{ ...datum, color: C.muted, margin: 0 }}>
            {cards.length + (cycleCard ? 1 : 0)} PROGRAM
            {cards.length + (cycleCard ? 1 : 0) === 1 ? "" : "S"} ·{" "}
            {needing === 0
              ? "NOTHING NEEDS ANYONE TODAY"
              : `${needing} NEED${needing === 1 ? "S" : ""} SOMEONE TODAY`}
          </p>
        </div>

        <SectionLinks section="programs" />
      </div>

      {/* Said once, with the names, and one thing to do about it. */}
      {all && unled.length > 0 && (
        <div style={{ margin: "0 0 18px" }}>
          <BandRow
            tone="warn"
            label="No coordinator"
            figure={String(unled.length)}
            title={`${unled.length} program${unled.length === 1 ? "" : "s"} ${unled.length === 1 ? "has" : "have"} nobody running ${unled.length === 1 ? "it" : "them"}`}
            line={unled.map((c) => c.name).join(", ")}
            action={
              canAssign
                ? { label: "Assign coordinators", href: `/admin/programs/${unled[0].slug}?tab=setup` }
                : undefined
            }
          />
        </div>
      )}

      {cards.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.5, maxWidth: "58ch" }}>
            You are not down as running any program yet. Whoever holds the Coordinators permission
            can add you on the program&rsquo;s own page.
          </p>
        </div>
      ) : (
        <div className="joc-program-cards">
          {cycleCard && (
            <Link
              href="/admin/cycles"
              className="joc-card"
              style={{ ...rowCard, display: "flex", flexDirection: "column", textDecoration: "none" }}
            >
              <span aria-hidden="true" style={{ display: "block", height: "6px", backgroundColor: C.blue }} />

              <span style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.025em", color: C.ink, lineHeight: 1.15, minWidth: 0 }}>
                    Chesed Cycles
                  </span>
                  <span style={{ ...label, color: C.muted, whiteSpace: "nowrap" }}>year-round</span>
                </span>

                {cycleCard.need > 0 ? (
                  <span style={{ display: "flex", alignItems: "baseline", gap: "9px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F.ui, fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: C.orangeText }}>
                      {cycleCard.need}
                    </span>
                    <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink }}>need you</span>
                  </span>
                ) : (
                  <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.greenText }}>
                    Nothing needs anyone
                  </span>
                )}

                {/* Its own status line, so it never reads like a program's. */}
                <span style={{ ...datum, color: cycleCard.running ? C.muted : C.orangeText }}>
                  {cycleCard.running
                    ? `CYCLE ${cycleCard.running.num} RUNNING · ${cycleCard.withLessons} OF ${cycleCard.total} WITH LESSONS`
                    : "NO CYCLE IS RUNNING TODAY"}
                </span>

                <span style={{ marginTop: "auto", paddingTop: "4px", fontFamily: F.ui, fontSize: "14px", color: C.muted }}>
                  Every school is on it
                </span>
              </span>
            </Link>
          )}

          {cards.map((p) => (
            <Link
              key={p.id}
              href={`/admin/programs/${p.slug}`}
              className="joc-card"
              style={{ ...rowCard, display: "flex", flexDirection: "column", textDecoration: "none" }}
            >
              <span aria-hidden="true" style={{ display: "block", height: "6px", backgroundColor: strip(p.heroColor) }} />

              <span style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.025em", color: C.ink, lineHeight: 1.15, minWidth: 0 }}>
                    {p.name}
                  </span>
                  <span style={{ ...label, color: C.muted, whiteSpace: "nowrap" }}>
                    {p.tag}
                    {!p.published && " · draft"}
                  </span>
                </span>

                {/* The figure is the point of the page. */}
                {p.need > 0 ? (
                  <span style={{ display: "flex", alignItems: "baseline", gap: "9px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F.ui, fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: C.orangeText }}>
                      {p.need}
                    </span>
                    <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink }}>need you</span>
                  </span>
                ) : p.needKnown ? (
                  <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.greenText }}>
                    Nothing needs anyone
                  </span>
                ) : (
                  <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.orangeText }}>
                    Sign-ups not recorded yet
                  </span>
                )}

                <span style={{ ...datum, color: p.status.warn ? C.orangeText : C.muted }}>
                  {p.status.text}
                </span>

                <span style={{ marginTop: "auto", paddingTop: "4px", fontFamily: F.ui, fontSize: "14px", color: C.muted }}>
                  {p.lead ? `Run by ${p.lead}` : "No coordinator yet"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
