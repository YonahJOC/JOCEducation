"use client";

import { useState } from "react";
import { label, R, C, pageTitle } from "@/lib/joc-tokens";
import Link from "next/link";
import { LessonEditor, EMPTY_LESSON, type LessonDraft, type CycleRef } from "@/components/admin/LessonEditor";
import { BulkImport } from "@/components/admin/BulkImport";
import { PageIntro } from "@/components/admin/PageIntro";

const GRADE_LABELS: Record<string, string> = { es: "Elementary", ms: "Middle", hs: "High school" };

export type LessonRow = LessonDraft & { id: number };

export function LessonsClient({
  lessons, cycles, disabled,
}: {
  lessons: LessonRow[];
  cycles: CycleRef[];
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState<LessonDraft | null>(null);

  if (editing) {
    return (
      <div>
        <button
          onClick={() => setEditing(null)}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: C.blue, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
        >
          ← All lessons
        </button>
        <h1 style={pageTitle}>
          {editing.id ? "Edit lesson" : "New lesson"}
        </h1>
        <LessonEditor
          initial={editing}
          cycles={cycles}
          disabled={disabled}
          onDone={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <PageIntro
        title="Lesson plans"
        what="The lessons teachers open and teach. Each one carries its objectives, what the teacher needs in hand, timed steps, discussion points, and the printables that go with it."
        steps={[
          "Press “+ New lesson”.",
          "Write the title, then pick the Chesed Cycle it belongs to, the grade band, how long it runs and how much preparation it needs.",
          "Fill in the objectives, materials, steps and discussion points. The panel on the right lists what is still missing and checks the steps add up to the lesson length.",
          "Under “Printables and handouts”, give each file a name a teacher will recognise, then upload the file.",
          "Tick Published and Save. It is on the site immediately.",
        ]}
        note="Leave Published unticked to keep working on it. Nothing unpublished is visible to anyone outside this console."
      >
        <button
          onClick={() => setEditing({ ...EMPTY_LESSON })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "11px 20px",
            minHeight: "42px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New lesson
        </button>
      </PageIntro>

      <div style={{ marginBottom: "16px" }}>
        <BulkImport cycles={cycles} disabled={disabled} />
      </div>

      <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
        {lessons.length === 0 ? (
          <p style={{ padding: "24px 20px", fontSize: "14px", color: "#4A5A74", margin: 0 }}>
            No lessons yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["Title", "Grade", "Time", "Cycle", "Status", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "11px 20px", ...label, color: "#4A5A74", borderBottom: `1px solid ${C.hairline}`, backgroundColor: C.panel, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => {
                  const cycle = cycles.find((c) => c.slug === l.cycleSlug);
                  return (
                    <tr key={l.id}>
                      <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}` }}>
                        <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>{l.title}</span>
                        <span style={{ fontSize: "13px", color: "#4A5A74" }}>{l.theme}</span>
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, color: "#4A5A74", whiteSpace: "nowrap" }}>
                        {GRADE_LABELS[l.grade] ?? l.grade}
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, color: "#4A5A74", whiteSpace: "nowrap" }}>
                        {l.timeMinutes} min
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, color: "#4A5A74" }}>
                        {cycle ? (
                          <>
                            {cycle.num}. {cycle.theme}
                            <span style={{ display: "block", fontSize: "12px", color: "#4A5A74" }}>
                              {l.cycleWeek
                                ? `Week ${l.cycleWeek}${cycle.weeks[l.cycleWeek - 1] ? ` — ${cycle.weeks[l.cycleWeek - 1]}` : ""}`
                                : "any week"}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: C.muted }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}` }}>
                        <span style={{
                          display: "inline-block", fontSize: "12px", fontWeight: 700, padding: "3px 9px", borderRadius: R.chip,
                          color: l.published ? "#1D6B37" : "#C96C00",
                          backgroundColor: l.published ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)",
                        }}>
                          {l.published ? "published" : "draft"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => setEditing(l)}
                          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: "12px" }}
                        >
                          Edit
                        </button>
                        {/* A draft has no public page, so previewing it needs
                            to say so — otherwise "View" 404s and looks broken. */}
                        <Link
                          href={l.published ? `/lesson-plans/${l.id}` : `/lesson-plans/${l.id}?preview=1`}
                          target="_blank"
                          style={{ fontSize: "13px", color: "#4A5A74", textDecoration: "none" }}
                        >
                          {l.published ? "View" : "Preview"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
