import Link from "next/link";
import { LESSONS } from "@/lib/lessons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lessons — Admin" };

const GRADE_LABEL: Record<string, string> = { es: "Elementary", ms: "Middle", hs: "High school" };
const PREP_COLOR: Record<string, { bg: string; text: string }> = {
  Minimal:     { bg: "#E8F5EE", text: "#1B7F4B" },
  Moderate:    { bg: "#FDEEDA", text: "#9A5405" },
  Substantial: { bg: "#FDE8E8", text: "#9A1515" },
};

export default function AdminLessonsPage() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "6px" }}>Lesson Plans</h1>
          <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)" }}>{LESSONS.length} lessons · All published</p>
        </div>
        <button
          style={{ backgroundColor: "#1E47B8", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 22px", border: "none", cursor: "pointer" }}
        >
          + Add lesson
        </button>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 80px", gap: "0", padding: "12px 24px", borderBottom: "1px solid rgba(16,35,63,.1)", backgroundColor: "#F8FAFE" }}>
          {["Title", "Grade", "Time", "Prep", ""].map((col) => (
            <div key={col} style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(16,35,63,.45)" }}>
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {LESSONS.map((lesson, i) => {
          const pc = PREP_COLOR[lesson.prep];
          return (
            <div
              key={lesson.id}
              style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 80px", gap: "0", padding: "16px 24px", borderBottom: i < LESSONS.length - 1 ? "1px solid rgba(16,35,63,.07)" : "none", alignItems: "center" }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "#10233F", marginBottom: "2px" }}>{lesson.title}</div>
                <div style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)" }}>{lesson.theme}</div>
              </div>
              <div style={{ fontSize: "13.5px", color: "#10233F" }}>{GRADE_LABEL[lesson.grade]}</div>
              <div style={{ fontSize: "13.5px", color: "#10233F" }}>{lesson.time} min</div>
              <div>
                <span style={{ backgroundColor: pc.bg, color: pc.text, fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 10px" }}>
                  {lesson.prep}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link href={`/lesson-plans/${lesson.id}`} style={{ fontSize: "13px", color: "#1E47B8", fontWeight: 600, textDecoration: "none" }}>
                  View
                </Link>
                <button style={{ fontSize: "13px", color: "rgba(16,35,63,.5)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "20px", fontSize: "13px", color: "rgba(16,35,63,.4)" }}>
        Note: This page currently reads from the static data file (<code>src/lib/lessons.ts</code>). Once the database is connected and seeded, this will be replaced with live Prisma queries.
      </p>
    </div>
  );
}
