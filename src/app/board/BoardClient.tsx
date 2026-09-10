"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { submitBoardPost, toggleBoardLike } from "@/app/actions/board";

export type BoardIdea = {
  id: string;
  title: string;
  body: string;
  region: string;
  school: string;
  grade: string;
  likes: number;
  ts: string;
  liked: boolean;
};

const GRADE_OPTIONS = [
  { key: "all", label: "All grades" },
  { key: "es", label: "Elementary" },
  { key: "ms", label: "Middle" },
  { key: "hs", label: "High school" },
];
const SORT_OPTIONS = [
  { key: "recent", label: "Most recent" },
  { key: "popular", label: "Most useful" },
];

const PER_PAGE = 8;

export function BoardClient({
  ideas, signedIn, defaultSchool, defaultRegion,
}: {
  ideas: BoardIdea[];
  signedIn: boolean;
  defaultSchool: string;
  defaultRegion: string;
}) {
  const [region, setRegion] = useState("All");
  const [grade, setGrade] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optimistic like state, so the button responds before the round trip.
  const [likeShift, setLikeShift] = useState<Record<string, boolean>>({});

  const [fTitle, setFTitle] = useState("");
  const [fSchool, setFSchool] = useState(defaultSchool);
  const [fRegion, setFRegion] = useState(defaultRegion);
  const [fGrade, setFGrade] = useState("es");
  const [fBody, setFBody] = useState("");

  const allRegions = useMemo(
    () => ["All", ...Array.from(new Set(ideas.map((i) => i.region))).sort()],
    [ideas]
  );

  const filtered = useMemo(() => {
    const out = ideas.filter((i) => {
      if (region !== "All" && i.region !== region) return false;
      if (grade !== "all" && i.grade !== grade) return false;
      return true;
    });
    return sort === "popular" ? [...out].sort((a, b) => b.likes - a.likes) : out;
  }, [ideas, region, grade, sort]);

  const visible = filtered.slice(0, page * PER_PAGE);
  const hasMore = visible.length < filtered.length;

  function isLiked(i: BoardIdea) {
    return likeShift[i.id] ?? i.liked;
  }
  function likeCount(i: BoardIdea) {
    const shifted = likeShift[i.id];
    if (shifted === undefined || shifted === i.liked) return i.likes;
    return i.likes + (shifted ? 1 : -1);
  }

  function submit() {
    setError(null);
    start(async () => {
      const r = await submitBoardPost({
        title: fTitle, body: fBody, region: fRegion, schoolName: fSchool, grade: fGrade as "es" | "ms" | "hs",
      });
      if (!r.ok) { setError(r.error); return; }
      setShowForm(false);
      setFTitle(""); setFBody("");
      setNotice("Thank you — your idea is with the JOC education team and will appear once they have read it.");
    });
  }

  function like(i: BoardIdea) {
    if (!signedIn) { setError("Sign in to mark an idea useful."); return; }
    const next = !isLiked(i);
    setLikeShift((s) => ({ ...s, [i.id]: next }));
    start(async () => {
      const r = await toggleBoardLike(i.id);
      if (!r.ok) {
        setLikeShift((s) => ({ ...s, [i.id]: !next }));
        setError(r.error);
      }
    });
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "36px" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>TEACHERS&rsquo; BOARD</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "10px" }}>
            What other schools are running.
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "56ch" }}>
            Teachers share what they actually ran — what worked, what didn&rsquo;t, and what surprised
            them. Filter by region or grade to find ideas from schools like yours.
          </p>
        </div>
        {signedIn ? (
          <button
            onClick={() => { setShowForm(!showForm); setNotice(null); setError(null); }}
            style={{ fontFamily: "var(--font-outfit)", backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 22px", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: "46px" }}
          >
            {showForm ? "Close" : "+ Share an idea"}
          </button>
        ) : (
          <Link
            href="/login"
            style={{ backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 22px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Sign in to share an idea
          </Link>
        )}
      </div>

      {notice && (
        <div style={{ backgroundColor: "rgba(27,127,75,.08)", border: "1px solid rgba(27,127,75,.25)", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14.5px", color: "#1B7F4B", margin: 0, lineHeight: 1.5 }}>{notice}</p>
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: "rgba(184,50,30,.07)", border: "1px solid rgba(184,50,30,.25)", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14.5px", color: "#B8321E", margin: 0, lineHeight: 1.5 }}>{error}</p>
        </div>
      )}

      {/* Post form */}
      {showForm && signedIn && (
        <div style={{ backgroundColor: "#fff", border: "2px solid #FA912D", borderRadius: "20px", padding: "28px", marginBottom: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h3 style={{ fontWeight: 700, fontSize: "18px", color: "#10233F", margin: "0 0 4px" }}>Share what you ran</h3>
          <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Idea title (required)" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
            <input value={fSchool} onChange={(e) => setFSchool(e.target.value)} placeholder="School name" style={inputStyle} />
            <input value={fRegion} onChange={(e) => setFRegion(e.target.value)} placeholder="Region — Brooklyn, Lakewood…" style={inputStyle} />
            <select value={fGrade} onChange={(e) => setFGrade(e.target.value)} style={inputStyle}>
              <option value="es">Elementary</option>
              <option value="ms">Middle school</option>
              <option value="hs">High school</option>
            </select>
          </div>
          <textarea
            value={fBody}
            onChange={(e) => setFBody(e.target.value)}
            placeholder="Describe what you ran — the more detail, the more useful it is to other teachers."
            rows={5}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <p style={{ fontSize: "13px", color: "rgba(16,35,63,.5)", margin: 0 }}>
            Posts appear on the board once the JOC education team has read them.
          </p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={submit}
              disabled={pending}
              style={{ fontFamily: "var(--font-outfit)", backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 24px", border: "none", cursor: pending ? "wait" : "pointer", opacity: pending ? 0.6 : 1, minHeight: "46px" }}
            >
              {pending ? "Posting…" : "Post to the board"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{ fontFamily: "var(--font-outfit)", background: "none", border: "none", color: "rgba(16,35,63,.55)", cursor: "pointer", fontSize: "14px", fontWeight: 500, minHeight: "46px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters + sort */}
      <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "18px 22px", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {allRegions.map((r) => (
            <button
              key={r}
              onClick={() => { setRegion(r); setPage(1); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13px", padding: "8px 14px", minHeight: "40px", borderRadius: "9999px", border: region === r ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.18)", backgroundColor: region === r ? "#10233F" : "#fff", color: region === r ? "#fff" : "#10233F", cursor: "pointer" }}
            >
              {r}
            </button>
          ))}
        </div>
        <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(16,35,63,.1)" }} />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {GRADE_OPTIONS.map((g) => (
            <button
              key={g.key}
              onClick={() => { setGrade(g.key); setPage(1); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13px", padding: "8px 14px", minHeight: "40px", borderRadius: "9999px", border: grade === g.key ? "1.5px solid #2D46AF" : "1px solid rgba(16,35,63,.18)", backgroundColor: grade === g.key ? "#2D46AF" : "#fff", color: grade === g.key ? "#fff" : "#10233F", cursor: "pointer" }}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "rgba(16,35,63,.45)", fontWeight: 500 }}>
            {filtered.length} {filtered.length === 1 ? "idea" : "ideas"}
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: "#10233F", fontWeight: 600, border: "1px solid rgba(16,35,63,.18)", borderRadius: "9999px", padding: "8px 14px", minHeight: "40px", backgroundColor: "#fff", cursor: "pointer", outline: "none" }}
          >
            {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Ideas */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontSize: "16px", color: "rgba(16,35,63,.5)" }}>No ideas match those filters yet.</p>
          <button
            onClick={() => { setRegion("All"); setGrade("all"); setPage(1); }}
            style={{ fontFamily: "var(--font-outfit)", marginTop: "16px", backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "14px", borderRadius: "9999px", padding: "11px 22px", border: "none", cursor: "pointer", minHeight: "44px" }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
            {visible.map((idea) => (
              <div key={idea.id} style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ backgroundColor: "#F4F7FD", color: "#12306F", fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 12px" }}>{idea.region}</span>
                    <span style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 12px" }}>
                      {idea.grade === "es" ? "Elementary" : idea.grade === "ms" ? "Middle" : "High school"}
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "rgba(16,35,63,.4)" }}>{idea.ts}</span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: "18.5px", lineHeight: 1.25, letterSpacing: "-0.02em", color: "#10233F", marginBottom: "8px" }}>{idea.title}</h2>
                <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", lineHeight: 1.6, marginBottom: "18px", whiteSpace: "pre-wrap" }}>{idea.body}</p>
                <div style={{ borderTop: "1px solid rgba(16,35,63,.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "rgba(16,35,63,.5)", fontWeight: 500 }}>{idea.school}</span>
                  <button
                    onClick={() => like(idea)}
                    style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13px", padding: "8px 14px", minHeight: "40px", borderRadius: "9999px", cursor: "pointer", border: isLiked(idea) ? "1px solid #FA912D" : "1px solid rgba(16,35,63,.18)", backgroundColor: isLiked(idea) ? "#FDEEDA" : "transparent", color: isLiked(idea) ? "#9A5405" : "rgba(16,35,63,.6)" }}
                  >
                    {isLiked(idea) ? "★" : "☆"} {likeCount(idea)} useful
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button
                onClick={() => setPage(page + 1)}
                style={{ fontFamily: "var(--font-outfit)", backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "15px", borderRadius: "9999px", padding: "13px 28px", border: "none", cursor: "pointer", minHeight: "46px" }}
              >
                Load more ({filtered.length - visible.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.18)", borderRadius: "12px",
  padding: "12px 16px", fontSize: "14.5px", color: "#10233F", fontFamily: "var(--font-outfit)",
  width: "100%", boxSizing: "border-box", outline: "none", minHeight: "46px",
};
