"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProgramReporting } from "@/lib/ambassadors";
import {
  C, R, ROW_SHADOW, CONTENT_MAX, chip, bandLabel, sectionHeading, sectionIntro,
  plainChip,
} from "@/lib/joc-tokens";

/**
 * What the ambassadors are reporting, for JOC.
 *
 * No student's name appears here, and cannot: `ReportForStaff` has no field
 * for one. The useful signal is not the volume of reports — it is which
 * schools have gone quiet, because a school that stops reporting is a school
 * about to churn, and JOC currently learns that at renewal.
 */

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export function ProgramReports({
  programName, data,
}: {
  programName: string;
  data: ProgramReporting;
}) {
  const [open, setOpen] = useState(false);

  if (data.totals.ambassadors === 0) {
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto 16px" }} id="reports">
        <h2 style={sectionHeading}>
          What the ambassadors report
        </h2>
        <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "24px", marginTop: "12px" }}>
          <p style={{ fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: "64ch" }}>
            No school has student ambassadors on {programName} yet. Two students per school run the
            program on the ground and write up what happened each time — their teacher hands them a
            code from their own school panel, under &ldquo;Your ambassadors&rdquo;. Nothing here ever
            names a student.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto 16px" }} id="reports">
      <h2 style={sectionHeading}>
        What the ambassadors report
      </h2>
      <p style={sectionIntro}>
        Written by the students who run it, counted here. No student is named — that stays with their
        own teacher. Participation figures are the students&rsquo; own estimates.
      </p>

      <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: "14px" }}>
        <Figure label="Schools" value={String(data.totals.schools)} />
        <Figure label="Ambassadors" value={String(data.totals.ambassadors)} />
        <Figure label="Reports this month" value={String(data.totals.reportsThisMonth)} />
        <Figure
          label="Gone quiet"
          value={String(data.totals.quiet)}
          warn={data.totals.quiet > 0}
        />
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {data.schools.map((s) => (
          <div key={s.schoolId} style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "15px 18px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: "min(100%, 240px)" }}>
              <span style={{ display: "block", fontFamily: "var(--font-outfit)", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink }}>
                <Link href={`/admin/schools/${s.schoolId}`} style={{ color: C.ink, textDecoration: "none" }}>
                  {s.schoolName}
                </Link>
              </span>
              <span style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                <span style={plainChip}>
                  {s.ambassadors} ambassador{s.ambassadors === 1 ? "" : "s"}
                </span>
                <span style={{ ...chip, backgroundColor: C.panel, color: s.reportsThisMonth === 0 ? C.orangeText : C.ink }}>
                  {s.reportsThisMonth === 0
                    ? "Nothing this month"
                    : `${s.reportsThisMonth} report${s.reportsThisMonth === 1 ? "" : "s"} this month`}
                </span>
                <span style={{ ...chip, backgroundColor: C.panel, color: s.participantsThisMonth == null ? C.orangeText : C.ink }}>
                  {s.participantsThisMonth == null
                    ? "No numbers given"
                    : `~${s.participantsThisMonth} students this month — their estimate`}
                </span>
              </span>
            </span>
            <span style={{ ...chip, backgroundColor: s.quiet ? C.orangeTint : C.greenTint, color: s.quiet ? C.orangeText : C.greenText, fontSize: "13px", padding: "7px 12px" }}>
              {s.lastReportOn ? `Last ${day(s.lastReportOn)}` : "Never reported"}
            </span>
          </div>
        ))}
      </div>

      {data.recent.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.blue,
              background: "none", border: "none", textDecoration: "underline", cursor: "pointer",
              minHeight: "44px", padding: 0, marginTop: "10px",
            }}
          >
            {open ? "Hide what they wrote" : `Read what they wrote (${data.recent.length})`}
          </button>

          {open && (
            <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
              {data.recent.map((r) => (
                <div key={r.id} style={{ backgroundColor: C.white, borderRadius: R.form, border: `1px solid ${C.hairline}`, padding: "14px 16px" }}>
                  <p style={{ ...bandLabel, fontSize: "11px", color: C.muted, margin: "0 0 6px" }}>
                    {r.schoolName} · {day(r.occurredOn)}
                    {r.participants != null && ` · about ${r.participants} students, their estimate`}
                  </p>
                  <p style={{ fontSize: "15px", color: C.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {r.whatHappened}
                  </p>
                  {r.wouldChange && (
                    <p style={{ fontSize: "15px", color: C.muted, margin: "7px 0 0", lineHeight: 1.55 }}>
                      <strong style={{ color: C.ink }}>Would change:</strong> {r.wouldChange}
                    </p>
                  )}
                  <p style={{ fontSize: "12.5px", color: C.muted, margin: "8px 0 0" }}>
                    Written by an ambassador at {r.schoolName}.
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Figure({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ backgroundColor: warn ? C.orangeTint : C.white, borderRadius: R.form, boxShadow: warn ? "none" : ROW_SHADOW, padding: "14px 16px" }}>
      <p style={{ ...bandLabel, fontSize: "11px", color: warn ? C.orangeText : C.muted, margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-outfit)", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", color: warn ? C.orangeText : C.ink, margin: 0, lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  );
}
