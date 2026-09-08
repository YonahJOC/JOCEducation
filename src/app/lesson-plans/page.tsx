"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { LESSONS, GRADE_LABELS, TIME_LABELS, STRIPE_COLORS } from "@/lib/lessons";

const PREP_LABELS: Record<string, string> = { all: "Any prep", Minimal: "Minimal", Moderate: "Moderate", Substantial: "Substantial" };

export default function LessonPlansPage() {
  const [grade, setGrade] = useState("all");
  const [time, setTime] = useState("all");
  const [prep, setPrep] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return LESSONS.filter((l) => {
      if (grade !== "all" && l.grade !== grade) return false;
      if (time !== "all") {
        if (time === "90" && l.time < 90) return false;
        if (time !== "90" && l.time !== parseInt(time)) return false;
      }
      if (prep !== "all" && l.prep !== prep) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!l.title.toLowerCase().includes(q) && !l.theme.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [grade, time, prep, query]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 64px" }}>
      {/* Page header */}
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>LESSON LIBRARY</p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#10233F", marginBottom: "12px" }}>
        Every lesson plan we have.
      </h1>
      <p style={{ fontSize: "17px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "56ch", marginBottom: "40px" }}>
        Ready-to-use chesed lesson plans for elementary, middle, and high school. Download the full plan and all printables in one click.
      </p>

      {/* Search + filters */}
      <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "20px 24px", marginBottom: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "rgba(16,35,63,.4)", pointerEvents: "none" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by topic, theme, or keyword…"
            style={{ width: "100%", boxSizing: "border-box", paddingLeft: "38px", paddingRight: "14px", paddingTop: "11px", paddingBottom: "11px", fontSize: "15px", color: "#10233F", backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.15)", borderRadius: "12px", outline: "none", fontFamily: "var(--font-outfit)" }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
          <FilterGroup label="Grade">
            {Object.entries(GRADE_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} active={grade === k} onClick={() => setGrade(k)} />
            ))}
          </FilterGroup>
          <div style={{ width: "1px", height: "28px", backgroundColor: "rgba(16,35,63,.12)", flexShrink: 0 }} />
          <FilterGroup label="Time">
            {Object.entries(TIME_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} active={time === k} onClick={() => setTime(k)} />
            ))}
          </FilterGroup>
          <div style={{ width: "1px", height: "28px", backgroundColor: "rgba(16,35,63,.12)", flexShrink: 0 }} />
          <FilterGroup label="Prep">
            {Object.entries(PREP_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} active={prep === k} onClick={() => setPrep(k)} />
            ))}
          </FilterGroup>
          <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "13.5px", color: "rgba(16,35,63,.5)", whiteSpace: "nowrap" }}>
            {filtered.length} {filtered.length === 1 ? "plan" : "plans"}
          </span>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "72px 0" }}>
          <p style={{ fontSize: "17px", color: "rgba(16,35,63,.55)", marginBottom: "16px" }}>No lesson plans match those filters.</p>
          <button
            onClick={() => { setGrade("all"); setTime("all"); setPrep("all"); setQuery(""); }}
            style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "14px", borderRadius: "9999px", padding: "11px 22px", border: "none", cursor: "pointer" }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
          {filtered.map((lesson, i) => (
            <LessonCard key={lesson.id} lesson={lesson} colorIndex={i % STRIPE_COLORS.length} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontWeight: 600, fontSize: "12px", color: "rgba(16,35,63,.45)", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ fontWeight: 600, fontSize: "13.5px", padding: "9px 16px", borderRadius: "9999px", border: active ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.2)", backgroundColor: active ? "#10233F" : "#fff", color: active ? "#fff" : "#10233F", cursor: "pointer", whiteSpace: "nowrap" }}
    >
      {label}
    </button>
  );
}

const GRADE_LABELS_FULL: Record<string, string> = { es: "Elementary", ms: "Middle", hs: "High school" };

function LessonCard({ lesson, colorIndex }: { lesson: (typeof LESSONS)[0]; colorIndex: number }) {
  const prepStyle = lesson.prep === "Minimal"
    ? { bg: "#F4F7FD", text: "#12306F" }
    : lesson.prep === "Moderate"
    ? { bg: "#FDEEDA", text: "#9A5405" }
    : { bg: "#FEE2E2", text: "#991B1B" };

  return (
    <Link
      href={`/lesson-plans/${lesson.id}`}
      style={{ display: "block", textDecoration: "none", backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden", transition: "border-color .15s, box-shadow .15s, transform .15s" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = "#1E47B8";
        el.style.boxShadow = "0 10px 28px rgba(16,35,63,.11)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = "rgba(16,35,63,.1)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      <div style={{ height: "8px", backgroundColor: STRIPE_COLORS[colorIndex] }} />
      <div style={{ padding: "20px" }}>
        <span style={{ display: "inline-block", backgroundColor: "#F4F7FD", color: "#1E47B8", fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: "9999px", padding: "5px 12px", marginBottom: "10px" }}>
          {lesson.theme}
        </span>
        <h2 style={{ fontWeight: 700, fontSize: "19.5px", lineHeight: 1.22, letterSpacing: "-0.025em", color: "#10233F", marginBottom: "8px" }}>{lesson.title}</h2>
        <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", lineHeight: 1.55, marginBottom: "16px" }}>{lesson.description}</p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          <MetaChip label={GRADE_LABELS_FULL[lesson.grade]} style={{ backgroundColor: "#F4F7FD", color: "#12306F" }} />
          <MetaChip label={`${lesson.time} min`} style={{ backgroundColor: "#F4F7FD", color: "#12306F" }} />
          <MetaChip label={`${lesson.prep} prep`} style={{ backgroundColor: prepStyle.bg, color: prepStyle.text }} />
        </div>
        <div style={{ borderTop: "1px solid rgba(16,35,63,.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "rgba(16,35,63,.45)" }}>{lesson.files.length} file{lesson.files.length !== 1 ? "s" : ""} included</span>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "#1E47B8" }}>Open plan →</span>
        </div>
      </div>
    </Link>
  );
}

function MetaChip({ label, style: s }: { label: string; style: React.CSSProperties }) {
  return <span style={{ fontWeight: 600, fontSize: "12.5px", padding: "5px 10px", borderRadius: "8px", ...s }}>{label}</span>;
}
