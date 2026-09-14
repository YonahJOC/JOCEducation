"use client";

import { useState } from "react";
import Link from "next/link";
import { LessonEditor, EMPTY_LESSON, type LessonDraft, type CycleRef } from "@/components/admin/LessonEditor";
import { BulkImport } from "@/components/admin/BulkImport";
import { PageIntro } from "@/components/admin/PageIntro";

const INK = "#10233F";
const BLUE = "#2D46AF";

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
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
        >
          ← All lessons
        </button>
        <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "0 0 20px" }}>
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
        what="The lessons teachers open and teach. Each one carries its objectives, what the teacher needs in hand, timed steps, discussion questions, and the printables that go with it."
        steps={[
          "Press “+ New lesson”.",
          "Write the title, then pick the Chesed Cycle it belongs to, the grade band, how long it runs and how much preparation it needs.",
          "Fill in the objectives, materials, steps and discussion questions. The panel on the right lists what is still missing and checks the steps add up to the lesson length.",
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
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "42px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New lesson
        </button>
      </PageIntro>

      <div style={{ marginBottom: "16px" }}>
        <BulkImport cycles={cycles} disabled={disabled} />
      </div>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
        {lessons.length === 0 ? (
          <p style={{ padding: "24px 20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>
            No lessons yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["Title", "Grade", "Time", "Cycle", "Status", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "11px 20px", fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}>
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
                      <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                        <span style={{ fontWeight: 600, color: INK, display: "block" }}>{l.title}</span>
                        <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)" }}>{l.theme}</span>
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)", whiteSpace: "nowrap" }}>
                        {GRADE_LABELS[l.grade] ?? l.grade}
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)", whiteSpace: "nowrap" }}>
                        {l.timeMinutes} min
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", color: "rgba(16,35,63,.75)" }}>
                        {cycle ? (
                          <>
                            {cycle.num}. {cycle.theme}
                            <span style={{ display: "block", fontSize: "12px", color: "rgba(16,35,63,.5)" }}>
                              {l.cycleWeek
                                ? `Week ${l.cycleWeek}${cycle.weeks[l.cycleWeek - 1] ? ` — ${cycle.weeks[l.cycleWeek - 1]}` : ""}`
                                : "any week"}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: "rgba(16,35,63,.35)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)" }}>
                        <span style={{
                          display: "inline-block", fontSize: "11.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "9999px",
                          color: l.published ? "#1B7F4B" : "#C96C00",
                          backgroundColor: l.published ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)",
                        }}>
                          {l.published ? "published" : "draft"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => setEditing(l)}
                          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, marginRight: "12px" }}
                        >
                          Edit
                        </button>
                        {/* A draft has no public page, so previewing it needs
                            to say so — otherwise "View" 404s and looks broken. */}
                        <Link
                          href={l.published ? `/lesson-plans/${l.id}` : `/lesson-plans/${l.id}?preview=1`}
                          target="_blank"
                          style={{ fontSize: "13px", color: "rgba(16,35,63,.55)", textDecoration: "none" }}
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
