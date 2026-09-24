import Link from "next/link";
import { requireSchoolPanel } from "./account-only";
import { safeAuth, openForReview } from "@/auth";
import { canRunOwnSchool, canRunSchoolApp } from "@/lib/access";
import { isDatabaseConfigured } from "@/lib/prisma";
import { STAGE_LABEL } from "@/lib/program-enrollment";
import { STEPS } from "@/lib/program-step";
import { getSchoolToday } from "@/lib/school-today";
import { C, F, R, label, datum, pageTitle, sectionHeading, rowCard } from "@/lib/joc-tokens";
import { BandRow } from "@/components/ui/BandRow";
import { currentSchoolId } from "@/lib/school-scope";

/**
 * Today, for a school (5a).
 *
 * The school panel used to open on its teacher list, which is an admin chore
 * rather than the reason anybody signs in. It opens instead on the handful of
 * things that are actually waiting this week, and then on where each program
 * has got to.
 *
 * The rows are computed in lib/school-today.ts, which also guarantees the one
 * rule this page depends on: at most one solid-orange band, so the page never
 * reads as a telling-off.
 */

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export default async function SchoolToday() {
  await requireSchoolPanel();

  const session = await safeAuth();
  const schoolId = await currentSchoolId();
  const runsAccount = openForReview || canRunOwnSchool(session?.user);

  if (!isDatabaseConfigured() || !schoolId) {
    return (
      <div>
        <h1 style={pageTitle}>Today</h1>
        <p style={{ fontFamily: F.read, fontSize: "17px", color: C.orangeText, lineHeight: 1.6, margin: 0 }}>
          Your account is not attached to a school yet, so there is nothing to show.
        </p>
      </div>
    );
  }

  // A write-up names a student, so only somebody who supervises them sees
  // that it exists.
  const canReadReports = openForReview || canRunSchoolApp(session?.user);

  const { rows, programs } = await getSchoolToday(schoolId, { canReadReports });

  const heading = rows.length === 0
    ? "Nothing needs you this week"
    : `${rows.length} thing${rows.length === 1 ? "" : "s"} for you this week`;

  return (
    <div>
      <h1 style={pageTitle}>{heading}</h1>
      <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 20px", maxWidth: "62ch" }}>
        {rows.length === 0
          ? "Nothing is waiting on anybody at your school. Your programs are below, with where each one has got to."
          : "Worst first. Everything below is something at your school, not something we are waiting to tell you."}
      </p>

      {rows.length > 0 && (
        <div style={{ display: "grid", gap: "10px", marginBottom: "26px" }}>
          {rows.map((r) => (
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

      <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>Your programs</h2>

      {programs.length === 0 ? (
        <div style={{ ...rowCard, padding: "24px" }}>
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.5, maxWidth: "58ch" }}>
            Your school is not down as running any JOC program yet. That fills in as JOC records
            them — there is nothing for you to do here.
          </p>
        </div>
      ) : (
        <div className="joc-also">
          {programs.map((p) => (
            <Link
              key={p.slug}
              href={`/school/programs/${p.slug}`}
              style={{
                ...rowCard, display: "block", textDecoration: "none",
                overflow: "hidden", padding: 0,
              }}
            >
              {/* The program's own colour, so two cards are never confused. */}
              <span aria-hidden="true" style={{ display: "block", height: "8px", backgroundColor: p.heroColor }} />

              <span style={{ display: "block", padding: "18px 20px 20px" }}>
                <span style={{
                  display: "block", fontFamily: F.ui, fontSize: "20px", fontWeight: 700,
                  letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.2, marginBottom: "6px",
                }}>
                  {p.name}
                </span>

                <span style={{ ...datum, display: "block", marginBottom: "10px" }}>
                  STEP 0{p.step} / 0{STEPS} · {STAGE_LABEL[p.stage].toUpperCase()} SINCE{" "}
                  {day(p.since).toUpperCase()}
                </span>

                <span style={{
                  display: "block", fontFamily: F.read, fontSize: "15px", lineHeight: 1.5,
                  color: p.headline ? C.muted : C.orangeText,
                }}>
                  {p.headline ?? "Nothing has been recorded against it yet."}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {runsAccount && (
        <p style={{ ...label, color: C.muted, margin: "26px 0 0" }}>
          <Link href="/school/plan" style={{ color: C.blue }}>Your plan</Link>
          {" · "}
          <Link href="/school/teachers" style={{ color: C.blue }}>Who has a login</Link>
        </p>
      )}
    </div>
  );
}
