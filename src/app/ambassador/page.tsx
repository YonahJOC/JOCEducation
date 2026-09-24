import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { myAmbassadorship, myEndedAmbassadorship, myReports } from "@/lib/ambassadors";
import { AmbassadorHome } from "@/components/ambassador/AmbassadorHome";
import { C, R, ROW_SHADOW } from "@/lib/joc-tokens";

/**
 * The ambassador's one page: their program, and what they have written up.
 *
 * Everything is scoped from the session through myAmbassadorship(). Nothing
 * on this page takes a school or a program from the address.
 */

export const metadata = { title: "Your program" };
export const dynamic = "force-dynamic";

export default async function AmbassadorPage() {
  const mine = await myAmbassadorship();

  if (!mine) {
    const ended = await myEndedAmbassadorship();
    return (
      <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "28px 24px" }}>
        <p style={{ fontFamily: "var(--font-outfit)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 8px" }}>
          {ended ? "Your time running it has finished" : "You are not an ambassador yet"}
        </p>
        <p style={{ fontSize: "16px", color: C.muted, margin: "0 0 18px", lineHeight: 1.6, maxWidth: "52ch" }}>
          {ended
            ? `You ran ${ended.programName} until ${ended.endedOn.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}. Everything you wrote is still with your teacher. If you are running it again, they can give you a new code.`
            : "If a teacher has given you a code, enter it and you will be set up for the one program you run."}
        </p>
        <Link
          href="/ambassador/join"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 700,
            color: C.white, backgroundColor: C.blue, borderRadius: R.button,
            padding: "13px 22px", minHeight: "47px", textDecoration: "none",
          }}
        >
          Enter a code
        </Link>
      </div>
    );
  }

  const reports = await myReports(mine.id);

  // Dates the calendar says this program runs at their school, so a report
  // can be attached to one rather than typed blind.
  const runs = isDatabaseConfigured()
    ? (
        await prisma.programEvent.findMany({
          where: {
            schoolId: mine.schoolId,
            programId: mine.programId,
            status: { not: "CANCELLED" },
            startsAt: { lte: new Date(Date.now() + 86_400_000) },
          },
          orderBy: { startsAt: "desc" },
          take: 8,
          select: { id: true, title: true, startsAt: true },
        })
      ).map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt }))
    : [];

  return <AmbassadorHome scope={mine} reports={reports} runs={runs} />;
}
