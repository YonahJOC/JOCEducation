import Link from "next/link";
import { SectionLinks } from "@/components/admin/SectionLinks";
import { listProgramsForAdmin } from "@/lib/program-admin";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getProgramToday } from "@/lib/program-today";
import { schoolsInProgram } from "@/lib/program-enrollment";
import { C, rowCard, label, bandFigure, datum, F, pageTitle } from "@/lib/joc-tokens";
import { BandRow } from "@/components/ui/BandRow";

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

  const schoolCount = isDatabaseConfigured() ? await prisma.school.count() : 0;

  const cards = await Promise.all(
    programs.map(async (p) => {
      const [today, inIt] = await Promise.all([
        getProgramToday(p.id, p.slug),
        schoolsInProgram(p.id),
      ]);
      return {
        ...p,
        need: today.rows.length,
        inCount: inIt.size,
        notYet: Math.max(0, schoolCount - inIt.size),
        nextRun: today.comingUp[0]?.startsAt ?? null,
      };
    }),
  );

  // Worst first. A console with nothing to do sorts to the bottom, which is
  // where somebody with twenty minutes should find it.
  cards.sort((a, b) => b.need - a.need || a.name.localeCompare(b.name));

  // Seven of eight programs having nobody down as running them is one fact,
  // not seven. It was an orange sentence on every card, which made the page
  // read as broken and said nothing you could act on.
  const unled = cards.filter((c) => !c.lead).length;
  const needing = cards.filter((c) => c.need > 0).length;

  return (
    <div>
      <h1 style={pageTitle}>{all ? "Program consoles" : "Your programs"}</h1>

      <SectionLinks section="programs" />
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 18px", maxWidth: "62ch" }}>
        {all ? "Every program's own console — the same page its coordinator opens. " : "The programs you run. "}
        {needing === 0
          ? "Nothing needs anybody today."
          : `${needing} of the ${cards.length} needs somebody today, and ${needing === 1 ? "it is" : "they are"} first.`}
      </p>

      {all && unled > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <BandRow
            tone="warn"
            label="No lead"
            figure={String(unled)}
            title={`${unled === 1 ? "A program has" : "Programs have"} nobody down as running ${unled === 1 ? "it" : "them"}`}
            line="Being named on a program is what opens its console, so until somebody is, nobody but an admin can work on it."
            action={{ label: "Name them", href: `/admin/programs/${cards.find((c) => !c.lead)!.slug}?tab=setup` }}
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
          {cards.map((p) => {
            const status = [
              `${p.inCount} IN`,
              `${p.notYet} NOT YET`,
              p.nextRun
                ? `NEXT ${p.nextRun.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}`
                : "NOTHING BOOKED",
            ].join(" · ");

            return (
              <div
                key={p.id}
                className="joc-card"
                style={{
                  ...rowCard, display: "flex", flexDirection: "column",
                }}
              >
                <span aria-hidden="true" style={{ display: "block", height: "8px", backgroundColor: p.heroColor }} />

                <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* The name and the kind share a line, as in 2a. The kind
                      was stacked above it as a label, which made every card
                      open with the same small grey word. */}
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

                  <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.45, color: C.muted, margin: 0 }}>
                    {p.lead ? `Run by ${p.lead}` : "Nobody named yet"}
                  </p>

                  {/* The figure and its words on one baseline, as in 2a. The
                      big figure is for a real count: eight cards all reading
                      "None" at thirty pixels is a wall that says nothing, so
                      a nought drops to the size of the line it sits on. */}
                  {p.need > 0 ? (
                    <p style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: 0, flexWrap: "wrap" }}>
                      <span style={{ ...bandFigure, color: C.orangeText }}>{p.need}</span>
                      <span style={{ fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.ink }}>
                        {p.need === 1 ? "needs you today" : "need you today"}
                      </span>
                    </p>
                  ) : null}

                  <p style={{ ...datum, color: C.muted, margin: 0 }}>{status}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
