import Link from "next/link";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { listProgramsForAdmin } from "@/lib/program-admin";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getProgramToday } from "@/lib/program-today";
import { schoolsInProgram } from "@/lib/program-enrollment";
import { C, rowCard, label, bandFigure, datum, F, pageTitle } from "@/lib/joc-tokens";
import { programStatus } from "@/lib/program-status";

/**
 * Every program console, as cards.
 *
 * This was a list of names. Somebody opening it wanted to know which of the
 * eight needed them, and a list of names cannot say — so they opened all
 * eight. The cards are sorted by need, and the count is the biggest thing on
 * each one.
 *
 * It is not the Programs page: that one edits the public write-up and belongs
 * to the education team. This is the programs somebody actually runs.
 *
 * No capability guard — being named as running a program is the permission,
 * and listProgramsForAdmin already narrows the list to that person's own.
 */

export const metadata = { title: "Program consoles — JOC Console" };
export const dynamic = "force-dynamic";

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

  const [schoolCount, onTheApp] = isDatabaseConfigured()
    ? await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { appSchoolId: { not: null } } }),
      ])
    : [0, 0];

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

      return {
        ...p,
        need: today.rows.length,
        inCount: inIt.size,
        nextRun: today.comingUp[0]?.startsAt ?? null,
        status: programStatus({
          tag: p.tag,
          slug: p.slug,
          inCount: inIt.size,
          schoolCount,
          booked,
          nextRun: today.comingUp[0]?.startsAt ?? null,
          onTheApp,
        }),
      };
    }),
  );

  // Worst first. A console with nothing to do sorts to the bottom, which is
  // where somebody with twenty minutes should find it.
  cards.sort((a, b) => b.need - a.need || a.name.localeCompare(b.name));

  const needing = cards.filter((c) => c.need > 0).length;
  const unled = cards.filter((c) => !c.lead).length;

  return (
    <div>
      <p style={{ ...label, color: C.muted, margin: "0 0 6px" }}>
        Console · {all ? "Programs" : "Yours"}
      </p>
      <h1 style={{ ...pageTitle, margin: "0 0 10px" }}>{all ? "Program consoles" : "Your programs"}</h1>

      <SectionLinks section="programs" />

      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 18px", maxWidth: "62ch" }}>
        {all ? "Every program's own console — the same page its coordinator opens. " : "The programs you run. "}
        {needing === 0
          ? "Nothing needs anybody today."
          : `${needing} need${needing === 1 ? "s" : ""} somebody today, and ${needing === 1 ? "it is" : "they are"} first.`}
        {unled > 0 && ` ${unled} ${unled === 1 ? "has" : "have"} nobody down as running ${unled === 1 ? "it" : "them"}.`}
      </p>

      {cards.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.5, maxWidth: "58ch" }}>
            You are not down as running any program yet. Whoever holds the Coordinators permission
            can add you on the program&rsquo;s own page.
          </p>
        </div>
      ) : (
        <div className="joc-program-cards">
          {cards.map((p) => (
            <div key={p.id} className="joc-card" style={{ ...rowCard, display: "flex", flexDirection: "column" }}>
              <span aria-hidden="true" style={{ display: "block", height: "8px", backgroundColor: p.heroColor }} />

              <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                  <Link
                    href={`/admin/programs/${p.slug}`}
                    className="joc-card-link"
                    style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, textDecoration: "none", minWidth: 0 }}
                  >
                    {p.name}
                  </Link>
                  <span style={{ ...label, color: C.muted, whiteSpace: "nowrap" }}>
                    {p.tag}
                    {!p.published && " · draft"}
                  </span>
                </div>

                {/* What differs between these eight, so it is what the eye
                    lands on. 2a puts the figure here instead, but 2a has a
                    four, a two, a three and a one — ours are eight noughts,
                    and a nought printed at thirty pixels in eight places is
                    the loudest thing on the page saying the least. */}
                <p style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: 500, lineHeight: 1.4, color: p.lead ? C.muted : C.orangeText, margin: 0 }}>
                  {p.lead ? `Run by ${p.lead}` : "Nobody down as running it"}
                </p>

                {/* The figure only where there is one. The line above the grid
                    carries the nought, once. */}
                {p.need > 0 && (
                  <p style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: 0, flexWrap: "wrap" }}>
                    <span style={{ ...bandFigure, color: C.orangeText }}>{p.need}</span>
                    <span style={{ fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.ink }}>
                      {p.need === 1 ? "needs you today" : "need you today"}
                    </span>
                  </p>
                )}

                {/* Each kind of program is asked the question that is about
                    it, so no two of these lines are the same. */}
                <p style={{ ...datum, fontSize: "12px", color: p.status.warn ? C.orangeText : C.ink, margin: "auto 0 0", paddingTop: "2px" }}>
                  {p.status.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

