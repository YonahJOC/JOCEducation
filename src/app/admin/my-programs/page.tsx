import Link from "next/link";
import { listProgramsForAdmin } from "@/lib/program-admin";
import { safeAuth, openForReview } from "@/auth";
import { can } from "@/lib/access";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getProgramToday } from "@/lib/program-today";
import { schoolsInProgram } from "@/lib/program-enrollment";
import { C, R, ROW_SHADOW, CONTENT_MAX, label, F, pageTitle } from "@/lib/joc-tokens";

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

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <h1 style={pageTitle}>{all ? "Program consoles" : "Your programs"}</h1>
      <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, lineHeight: 1.6, margin: "0 0 24px", maxWidth: "62ch" }}>
        {all
          ? "Every program's own console — the same page its coordinator opens. Sorted by what needs somebody today."
          : "The programs you run. Sorted by what needs you today."}
      </p>

      {cards.length === 0 ? (
        <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "32px 24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "17px", color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: "58ch" }}>
            You are not down as running any program yet. Whoever holds the Coordinators permission
            can add you on the program&rsquo;s own page.
          </p>
        </div>
      ) : (
        <div className="joc-program-cards">
          {cards.map((p) => {
            const status = [
              `${p.inCount} in`,
              `${p.notYet} not yet`,
              p.nextRun
                ? `next ${p.nextRun.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}`
                : "nothing booked",
            ].join(" · ");

            return (
              <Link
                key={p.id}
                href={`/admin/programs/${p.slug}`}
                style={{
                  backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW,
                  overflow: "hidden", textDecoration: "none", display: "flex", flexDirection: "column",
                }}
              >
                <span aria-hidden="true" style={{ display: "block", height: "8px", backgroundColor: p.heroColor }} />

                <span style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  <span>
                    <span style={{ ...label, color: C.muted, display: "block", marginBottom: "4px" }}>
                      {p.tag}
                      {!p.published && " · draft"}
                    </span>
                    <span style={{ fontFamily: F.ui, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.025em", color: C.ink, display: "block", lineHeight: 1.2 }}>
                      {p.name}
                    </span>
                  </span>

                  <span style={{
                    fontFamily: F.ui, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em",
                    lineHeight: 1.1, color: p.need > 0 ? C.orangeText : C.greenText,
                  }}>
                    {p.need > 0
                      ? `${p.need} need${p.need === 1 ? "s" : ""} you today`
                      : "Nothing needs you"}
                  </span>

                  <span style={{ ...label, color: C.muted, display: "block" }}>{status}</span>

                  <span style={{ marginTop: "auto", paddingTop: "6px" }}>
                    <span style={{ fontFamily: F.read, fontSize: "15px", color: p.lead ? C.muted : C.orangeText, lineHeight: 1.5 }}>
                      {p.lead ? `Run by ${p.lead}` : "Nobody is down as running it"}
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
