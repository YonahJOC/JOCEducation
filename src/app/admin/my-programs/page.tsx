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
import { ProgramCard } from "@/components/admin/ProgramCard";
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
            <ProgramCard
              href="/admin/cycles"
              name="Chesed Cycles"
              tag="year-round"
              stripColor={C.blue}
              need={cycleCard.need}
              status={
                cycleCard.running
                  ? `CYCLE ${cycleCard.running.num} RUNNING · ${cycleCard.withLessons} OF ${cycleCard.total} WITH LESSONS`
                  : "NO CYCLE IS RUNNING TODAY"
              }
              statusWarn={!cycleCard.running}
              footer="Every school is on it"
            />
          )}

          {cards.map((p) => (
            <ProgramCard
              key={p.id}
              href={`/admin/programs/${p.slug}`}
              name={p.name}
              tag={p.tag}
              draft={!p.published}
              stripColor={strip(p.heroColor)}
              need={p.need}
              needKnown={p.needKnown}
              unknownLabel="Sign-ups not recorded yet"
              status={p.status.text}
              statusWarn={p.status.warn}
              footer={p.lead ? `Run by ${p.lead}` : "No coordinator yet"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
