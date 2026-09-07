"use client";
import { useState, useMemo } from "react";

const STRIPE_COLORS = ["#1E47B8", "#F7941D", "#2C7AC9", "#10233F"];

const LESSONS = [
  { id: 1, theme: "Bein Adam LaChaveiro", title: "Seeing the Person in Front of You", description: "Students learn to give full attention when someone speaks to them — eye contact, body language, and what it means to truly listen.", grade: "es", time: 20, prep: "Minimal", files: ["lesson-plan.pdf", "reflection-cards.pdf"] },
  { id: 2, theme: "Hachnasas Orchim", title: "The Open Door: Making Others Feel Welcome", description: "Through the lens of Avraham Avinu, students explore what genuine hospitality looks like in school and at home.", grade: "ms", time: 40, prep: "Minimal", files: ["lesson-plan.pdf", "source-sheet.pdf"] },
  { id: 3, theme: "Tzedakah", title: "More Than Money: What Tzedakah Really Means", description: "A deep look at the different forms of tzedakah — time, attention, expertise — beyond the pushke on the wall.", grade: "hs", time: 60, prep: "Moderate", files: ["lesson-plan.pdf", "case-studies.pdf", "discussion-guide.pdf"] },
  { id: 4, theme: "Bikur Cholim", title: "Visiting the Sick: Halacha and Heart", description: "Students learn the mitzvah of bikur cholim through halacha and personal stories, then plan a real class visit.", grade: "ms", time: 40, prep: "Moderate", files: ["lesson-plan.pdf", "halacha-sheet.pdf"] },
  { id: 5, theme: "Hakaras Hatov", title: "Who Do You Thank?", description: "A gratitude practice that moves from abstract to personal — students map every person who helped them get to school that morning.", grade: "es", time: 20, prep: "Minimal", files: ["lesson-plan.pdf", "gratitude-map.pdf"] },
  { id: 6, theme: "Chesed in Halacha", title: "Mekoros on Chesed: A Source Sheet Lesson", description: "A structured chevrusa session exploring primary sources on chesed obligations — designed for a full 90-minute shiur.", grade: "hs", time: 90, prep: "Substantial", files: ["lesson-plan.pdf", "source-sheet.pdf", "teacher-notes.pdf"] },
  { id: 7, theme: "Ahavas Yisrael", title: "One Klal, Many Schools", description: "Students reflect on what connects Jews across different communities and how everyday chesed builds achdus.", grade: "ms", time: 40, prep: "Minimal", files: ["lesson-plan.pdf"] },
  { id: 8, theme: "Kindness in Action", title: "Small Acts, Big Difference", description: "Interactive stations where students practice micro-chesed: holding a door, asking someone's name, noticing who sits alone.", grade: "es", time: 60, prep: "Moderate", files: ["lesson-plan.pdf", "station-cards.pdf"] },
  { id: 9, theme: "Middos", title: "Middos That Make Chesed Possible", description: "Connecting character traits — patience, generosity, humility — to real chesed practice. Includes a personal middos goal-setting activity.", grade: "hs", time: 60, prep: "Minimal", files: ["lesson-plan.pdf", "reflection-worksheet.pdf"] },
];

const GRADE_LABELS: Record<string, string> = { all: "All grades", es: "Elementary", ms: "Middle", hs: "High school" };
const TIME_LABELS: Record<string, string> = { all: "Any", "20": "20 min", "40": "40 min", "60": "60 min", "90": "90 min+" };

export function LessonPlansSection() {
  const [grade, setGrade] = useState("all");
  const [time, setTime] = useState("all");

  const filtered = useMemo(() => LESSONS.filter((l) => {
    if (grade !== "all" && l.grade !== grade) return false;
    if (time !== "all") {
      if (time === "90" && l.time < 90) return false;
      if (time !== "90" && l.time !== parseInt(time)) return false;
    }
    return true;
  }), [grade, time]);

  return (
    <section id="lesson-plans" style={{ padding: "66px 26px 20px", maxWidth: "1280px", margin: "0 auto" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>02 — LESSON PLANS</p>
      <h2 style={{ fontWeight: 800, fontSize: "clamp(29px, 3.5vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "28px" }}>
        Tomorrow's lesson, ready today.
      </h2>

      {/* Filter bar */}
      <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "20px 24px", display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {Object.entries(GRADE_LABELS).map(([k, v]) => (
            <Chip key={k} label={v} active={grade === k} onClick={() => setGrade(k)} />
          ))}
        </div>
        <div style={{ width: "1px", height: "28px", backgroundColor: "rgba(16,35,63,.12)" }} />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {Object.entries(TIME_LABELS).map(([k, v]) => (
            <Chip key={k} label={v} active={time === k} onClick={() => setTime(k)} />
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "13.5px", color: "rgba(16,35,63,.55)" }}>
          {filtered.length} {filtered.length === 1 ? "plan" : "plans"}
        </span>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <p style={{ color: "rgba(16,35,63,.55)", textAlign: "center", padding: "48px 0" }}>No lesson plans match those filters.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(292px, 1fr))", gap: "18px" }}>
          {filtered.map((lesson, i) => (
            <LessonCard key={lesson.id} lesson={lesson} colorIndex={i % 4} />
          ))}
        </div>
      )}
    </section>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ fontWeight: 600, fontSize: "13.5px", padding: "10px 16px", borderRadius: "9999px", border: active ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.2)", backgroundColor: active ? "#10233F" : "#fff", color: active ? "#fff" : "#10233F", cursor: "pointer" }}>
      {label}
    </button>
  );
}

function LessonCard({ lesson, colorIndex }: { lesson: typeof LESSONS[0]; colorIndex: number }) {
  const gradeLabel = GRADE_LABELS[lesson.grade];
  const prepColor = lesson.prep === "Minimal" ? { bg: "#F4F7FD", text: "#12306F" } : { bg: "#FDEEDA", text: "#9A5405" };

  return (
    <div
      style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden", transition: "border-color .15s, box-shadow .15s", cursor: "pointer" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1E47B8"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 26px rgba(16,35,63,.11)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(16,35,63,.1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      {/* Color stripe */}
      <div style={{ height: "8px", backgroundColor: STRIPE_COLORS[colorIndex] }} />
      <div style={{ padding: "20px" }}>
        {/* Theme pill */}
        <span style={{ display: "inline-block", backgroundColor: "#F4F7FD", color: "#1E47B8", fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: "9999px", padding: "5px 12px", marginBottom: "10px" }}>
          {lesson.theme}
        </span>
        <h3 style={{ fontWeight: 700, fontSize: "19.5px", lineHeight: 1.22, letterSpacing: "-0.025em", color: "#10233F", marginBottom: "8px" }}>{lesson.title}</h3>
        <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", lineHeight: 1.55, marginBottom: "16px" }}>{lesson.description}</p>
        {/* Meta chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          <MetaChip label={gradeLabel} style={{ backgroundColor: "#F4F7FD", color: "#12306F" }} />
          <MetaChip label={`${lesson.time} min`} style={{ backgroundColor: "#F4F7FD", color: "#12306F" }} />
          <MetaChip label={`${lesson.prep} prep`} style={{ backgroundColor: prepColor.bg, color: prepColor.text }} />
        </div>
        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(16,35,63,.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "rgba(16,35,63,.55)" }}>{lesson.files.join(", ")}</span>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#1E47B8" }}>Open plan →</span>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ label, style: s }: { label: string; style: React.CSSProperties }) {
  return (
    <span style={{ fontWeight: 600, fontSize: "12.5px", padding: "5px 10px", borderRadius: "8px", ...s }}>
      {label}
    </span>
  );
}
