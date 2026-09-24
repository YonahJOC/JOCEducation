"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { GRADE_LABELS, TIME_LABELS, STRIPE_COLORS } from "@/lib/lessons";
import type { PublicLesson } from "@/lib/content";
import { label as uiLabel, ROW_SHADOW, C, R } from "@/lib/joc-tokens";

const PREP_LABELS: Record<string, string> = { all: "Any prep", Minimal: "Minimal", Moderate: "Moderate", Substantial: "Substantial" };

/** Search and filtering over whatever lessons the server handed us. */
export function LessonsBrowser({
  lessons, savedIds = [], startSaved = false,
}: {
  lessons: PublicLesson[];
  /** The signed-in person's starred lessons. Empty when nobody is. */
  savedIds?: number[];
  /** Opened from the teacher's home, which links straight to them. */
  startSaved?: boolean;
}) {
  const [onlySaved, setOnlySaved] = useState(startSaved && savedIds.length > 0);
  const [grade, setGrade] = useState("all");
  const [time, setTime] = useState("all");
  const [prep, setPrep] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      if (onlySaved && !savedIds.includes(l.id)) return false;
      if (grade !== "all" && l.grade !== grade) return false;
      if (time !== "all") {
        if (time === "90" && Number(l.time) < 90) return false;
        if (time !== "90" && Number(l.time) !== parseInt(time)) return false;
      }
      if (prep !== "all" && l.prep !== prep) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!l.title.toLowerCase().includes(q) && !l.theme.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [lessons, onlySaved, savedIds, grade, time, prep, query]);

  return (
    <>
      {/* Search + filters */}
      <div style={{ backgroundColor: C.white, borderRadius: "20px", border: `1px solid ${C.hairline}`, padding: "20px 24px", marginBottom: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: C.muted, pointerEvents: "none" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by topic, theme, or keyword…"
            style={{ width: "100%", boxSizing: "border-box", paddingLeft: "38px", paddingRight: "14px", paddingTop: "11px", paddingBottom: "11px", fontSize: "15px", color: C.ink, backgroundColor: C.panel, border: `1px solid ${C.hairline}`, borderRadius: "12px", outline: "none", fontFamily: "var(--font-outfit)" }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
          {/* Only where there is something to show: a filter that always
              comes back empty is worse than no filter. */}
          {savedIds.length > 0 && (
            <FilterGroup label="Yours">
              <Chip
                label={`Saved · ${savedIds.length}`}
                active={onlySaved}
                onClick={() => setOnlySaved(!onlySaved)}
              />
            </FilterGroup>
          )}

          <FilterGroup label="Grade">
            {Object.entries(GRADE_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} active={grade === k} onClick={() => setGrade(k)} />
            ))}
          </FilterGroup>
          <div style={{ width: "1px", height: "28px", backgroundColor: C.panel, flexShrink: 0 }} />
          <FilterGroup label="Time">
            {Object.entries(TIME_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} active={time === k} onClick={() => setTime(k)} />
            ))}
          </FilterGroup>
          <div style={{ width: "1px", height: "28px", backgroundColor: C.panel, flexShrink: 0 }} />
          <FilterGroup label="Prep">
            {Object.entries(PREP_LABELS).map(([k, v]) => (
              <Chip key={k} label={v} active={prep === k} onClick={() => setPrep(k)} />
            ))}
          </FilterGroup>
          <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: "15px", color: C.muted, whiteSpace: "nowrap" }}>
            {filtered.length} {filtered.length === 1 ? "plan" : "plans"}
          </span>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "72px 0" }}>
          <p style={{ fontSize: "17px", color: C.muted, marginBottom: "16px" }}>
            {lessons.length === 0
              ? "No lesson plans have been published yet."
              : "No lesson plans match those filters."}
          </p>
          {lessons.length > 0 && (
            <button
              onClick={() => { setGrade("all"); setTime("all"); setPrep("all"); setQuery(""); }}
              style={{ backgroundColor: C.panel, color: C.ink, fontWeight: 600, fontSize: "14px", borderRadius: R.chip, padding: "11px 22px", border: "none", cursor: "pointer" }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
          {filtered.map((lesson, i) => (
            <LessonCard key={lesson.id} lesson={lesson} colorIndex={i % STRIPE_COLORS.length} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ ...uiLabel, color: C.muted, whiteSpace: "nowrap" }}>{label}</span>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ fontWeight: 600, fontSize: "15px", padding: "9px 16px", borderRadius: R.chip, border: active ? "1.5px solid #10233F" : `1px solid ${C.hairline}`, backgroundColor: active ? C.ink : C.white, color: active ? C.white : C.ink, cursor: "pointer", whiteSpace: "nowrap" }}
    >
      {label}
    </button>
  );
}

const GRADE_LABELS_FULL: Record<string, string> = { es: "Elementary", ms: "Middle", hs: "High school" };

function LessonCard({ lesson, colorIndex }: { lesson: PublicLesson; colorIndex: number }) {
  const prepStyle = lesson.prep === "Minimal"
    ? { bg: C.panel, text: C.blue }
    : lesson.prep === "Moderate"
    ? { bg: C.orangeTint, text: C.orangeText }
    : { bg: "#FEE2E2", text: "#991B1B" };

  return (
    <Link
      href={`/lesson-plans/${lesson.id}`}
      style={{ display: "block", textDecoration: "none", backgroundColor: C.white, borderRadius: "20px", border: `1px solid ${C.hairline}`, overflow: "hidden", transition: "border-color .15s, box-shadow .15s, transform .15s" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = C.blue;
        el.style.boxShadow = ROW_SHADOW;
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = C.hairline;
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      <div style={{ height: "8px", backgroundColor: STRIPE_COLORS[colorIndex] }} />
      <div style={{ padding: "20px" }}>
        <span style={{ display: "inline-block", backgroundColor: C.panel, color: C.blue, ...uiLabel, borderRadius: R.chip, padding: "5px 12px", marginBottom: "10px" }}>
          {lesson.theme}
        </span>
        <h2 style={{ fontWeight: 700, fontSize: "19.5px", lineHeight: 1.22, letterSpacing: "-0.025em", color: C.ink, marginBottom: "8px" }}>{lesson.title}</h2>
        <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.55, marginBottom: "16px" }}>{lesson.description}</p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          <MetaChip label={GRADE_LABELS_FULL[lesson.grade]} style={{ backgroundColor: C.panel, color: C.blue }} />
          <MetaChip label={`${lesson.time} min`} style={{ backgroundColor: C.panel, color: C.blue }} />
          <MetaChip label={`${lesson.prep} prep`} style={{ backgroundColor: prepStyle.bg, color: prepStyle.text }} />
        </div>
        <div style={{ borderTop: `1px solid ${C.hairline}`, paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: C.muted }}>
            {lesson.files.length} file{lesson.files.length !== 1 ? "s" : ""} included
          </span>
          <span style={{ fontWeight: 700, fontSize: "14px", color: C.blue }}>Open plan →</span>
        </div>
      </div>
    </Link>
  );
}

function MetaChip({ label, style: s }: { label: string; style: React.CSSProperties }) {
  return <span style={{ fontWeight: 600, fontSize: "13px", padding: "5px 10px", borderRadius: "8px", ...s }}>{label}</span>;
}
