"use client";

import { useState } from "react";

const SEED_IDEAS = [
  { id: "1", title: "Chesed Buddy System for New Students", body: "Paired every new student with a 'chesed buddy' for the first month. The buddy introduced them around, sat with them at lunch, and showed them the ropes. End-of-year survey: new students felt settled within two weeks on average.", region: "Brooklyn", school: "Yeshiva Darchei Torah", ts: "3 days ago", likes: 24, grade: "hs" },
  { id: "2", title: "Bikur Cholim Letter Writing Campaign", body: "Had the whole grade write personal letters to hospital patients at Maimonides. Coordinated with a local volunteer group to deliver them. Students were moved when volunteers reported back on the reactions.", region: "Brooklyn", school: "Beis Yaakov of Brooklyn", ts: "1 week ago", likes: 18, grade: "ms" },
  { id: "3", title: "Pre-Shabbos Food Pantry Drive", body: "Every Friday morning, a rotating class collects non-perishables for the local food pantry. Simple, predictable, and the kids own it. Now in its third year.", region: "Lakewood", school: "Beth Medrash Govoha elementary", ts: "2 weeks ago", likes: 41, grade: "es" },
  { id: "4", title: "Visiting Day for Local Elderly", body: "Partnered with the local senior center for monthly class visits. Students prepare a short Torah vort and bring mishloach manos-style packages. The seniors and students both look forward to it.", region: "Chicago", school: "Yeshivas Tiferes Tzvi", ts: "3 weeks ago", likes: 33, grade: "ms" },
  { id: "5", title: "Kindness Shoutout Board", body: "Set up a board in the hallway where students can post anonymous notes about acts of chesed they observed. Changed the social dynamics in the school in a way I didn't expect.", region: "Los Angeles", school: "Valley Torah", ts: "1 month ago", likes: 57, grade: "hs" },
  { id: "6", title: "JOC App Chesed Hours Ceremony", body: "At the end of every month, we do a brief in-class ceremony for students who logged 10+ chesed hours on the JOC App. A certificate and a two-minute sharing. Motivation went up significantly.", region: "Israel", school: "Yeshivat Shaalvim", ts: "1 month ago", likes: 29, grade: "hs" },
  { id: "7", title: "Cross-Grade Chesed Mentorship", body: "Ninth graders mentor third graders on a monthly basis. They plan and run a chesed activity together. Both grades show up differently.", region: "Toronto", school: "Or Chaim Day School", ts: "6 weeks ago", likes: 22, grade: "ms" },
  { id: "8", title: "Chesed Goal Cards for Rosh Hashana", body: "Before Rosh Hashana, each student writes one concrete chesed goal for the coming year on an index card. We seal them in envelopes and return them before Pesach for a check-in. Simple and powerful.", region: "Miami", school: "Scheck Hillel Community School", ts: "2 months ago", likes: 38, grade: "es" },
  { id: "9", title: "Monthly Chesed Challenge Competition", body: "Three class teams compete in a monthly chesed challenge — anonymous judges score on creativity, scale, and documentation. Trophy passed between winning homerooms. The competition element was surprisingly powerful.", region: "Brooklyn", school: "Bnos Yaakov", ts: "2 months ago", likes: 31, grade: "ms" },
  { id: "10", title: "Gratitude Wall in the Cafeteria", body: "Students write one thing they're grateful for on a sticky note every Monday morning. By end of semester the entire wall is covered. We photograph it before taking it down.", region: "Los Angeles", school: "YULA Boys High School", ts: "3 months ago", likes: 44, grade: "hs" },
  { id: "11", title: "Chesed Reflection at Dismissal", body: "Before dismissal every Friday, each student says one act of chesed they did this week. Takes three minutes. After a month it changed what students noticed about their own behavior.", region: "Chicago", school: "Beis Midrash L'Torah", ts: "3 months ago", likes: 19, grade: "es" },
  { id: "12", title: "Peer Teaching for Struggling Students", body: "Identified students who were strong in a subject and paired them with classmates who needed help. Framed entirely as chesed — not tutoring for credit. Both groups performed better on assessments.", region: "Toronto", school: "Eitz Chaim Schools", ts: "4 months ago", likes: 27, grade: "ms" },
];

const ALL_REGIONS = ["All", ...Array.from(new Set(SEED_IDEAS.map((i) => i.region))).sort()];
const GRADE_OPTIONS = [{ key: "all", label: "All grades" }, { key: "es", label: "Elementary" }, { key: "ms", label: "Middle" }, { key: "hs", label: "High school" }];
const SORT_OPTIONS = [{ key: "recent", label: "Most recent" }, { key: "popular", label: "Most useful" }];

export default function BoardPage() {
  const [region, setRegion] = useState("All");
  const [grade, setGrade] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showForm, setShowForm] = useState(false);
  const [ideas, setIdeas] = useState(SEED_IDEAS);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [fTitle, setFTitle] = useState("");
  const [fSchool, setFSchool] = useState("");
  const [fRegion, setFRegion] = useState("Brooklyn");
  const [fGrade, setFGrade] = useState("es");
  const [fBody, setFBody] = useState("");
  const [page, setPage] = useState(1);

  const PER_PAGE = 8;

  const filtered = ideas
    .filter((i) => {
      if (region !== "All" && i.region !== region) return false;
      if (grade !== "all" && i.grade !== grade) return false;
      return true;
    })
    .sort((a, b) => sort === "popular" ? b.likes - a.likes : 0);

  const visible = filtered.slice(0, page * PER_PAGE);
  const hasMore = visible.length < filtered.length;

  function submitIdea() {
    if (!fTitle.trim()) return;
    const newIdea = { id: String(Date.now()), title: fTitle, body: fBody, region: fRegion, school: fSchool || "Anonymous", ts: "Just now", likes: 0, grade: fGrade };
    setIdeas([newIdea, ...ideas]);
    setRegion(fRegion); setGrade("all");
    setShowForm(false); setPage(1);
    setFTitle(""); setFSchool(""); setFBody(""); setFRegion("Brooklyn"); setFGrade("es");
  }

  function toggleLike(id: string, currentLikes: number) {
    const wasLiked = likes[id];
    setLikes({ ...likes, [id]: !wasLiked });
    setIdeas(ideas.map((i) => i.id === id ? { ...i, likes: currentLikes + (wasLiked ? -1 : 1) } : i));
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "36px" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>TEACHERS' BOARD</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "10px" }}>
            What other schools are running.
          </h1>
          <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "56ch" }}>
            Teachers share what they actually ran — what worked, what didn't, and what surprised them. Filter by region or grade to find ideas from schools like yours.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: "#F7941D", color: "#10233F", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 22px", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {showForm ? "Close" : "+ Share an idea"}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div style={{ backgroundColor: "#fff", border: "2px solid #F7941D", borderRadius: "20px", padding: "28px", marginBottom: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h3 style={{ fontWeight: 700, fontSize: "18px", color: "#10233F", margin: "0 0 4px" }}>Share what you ran</h3>
          <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Idea title (required)" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <input value={fSchool} onChange={(e) => setFSchool(e.target.value)} placeholder="School name (optional)" style={inputStyle} />
            <select value={fRegion} onChange={(e) => setFRegion(e.target.value)} style={inputStyle}>
              {ALL_REGIONS.filter((r) => r !== "All").map((r) => <option key={r}>{r}</option>)}
              <option value="Other">Other</option>
            </select>
            <select value={fGrade} onChange={(e) => setFGrade(e.target.value)} style={inputStyle}>
              <option value="es">Elementary</option>
              <option value="ms">Middle school</option>
              <option value="hs">High school</option>
            </select>
          </div>
          <textarea value={fBody} onChange={(e) => setFBody(e.target.value)} placeholder="Describe what you ran — the more detail, the more useful it is to other teachers." rows={5} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={submitIdea} style={{ backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 24px", border: "none", cursor: "pointer" }}>
              Post to the board
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "rgba(16,35,63,.55)", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters + sort */}
      <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "18px 22px", marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
        {/* Region */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {ALL_REGIONS.map((r) => (
            <button key={r} onClick={() => { setRegion(r); setPage(1); }} style={{ fontWeight: 600, fontSize: "13px", padding: "8px 14px", borderRadius: "9999px", border: region === r ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.18)", backgroundColor: region === r ? "#10233F" : "#fff", color: region === r ? "#fff" : "#10233F", cursor: "pointer" }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(16,35,63,.1)" }} />
        {/* Grade */}
        <div style={{ display: "flex", gap: "6px" }}>
          {GRADE_OPTIONS.map((g) => (
            <button key={g.key} onClick={() => { setGrade(g.key); setPage(1); }} style={{ fontWeight: 600, fontSize: "13px", padding: "8px 14px", borderRadius: "9999px", border: grade === g.key ? "1.5px solid #1E47B8" : "1px solid rgba(16,35,63,.18)", backgroundColor: grade === g.key ? "#1E47B8" : "#fff", color: grade === g.key ? "#fff" : "#10233F", cursor: "pointer" }}>
              {g.label}
            </button>
          ))}
        </div>
        {/* Sort + count */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "rgba(16,35,63,.45)", fontWeight: 500 }}>{filtered.length} ideas</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ fontSize: "13.5px", color: "#10233F", fontWeight: 600, border: "1px solid rgba(16,35,63,.18)", borderRadius: "9999px", padding: "8px 14px", backgroundColor: "#fff", cursor: "pointer", outline: "none" }}>
            {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Ideas grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ fontSize: "16px", color: "rgba(16,35,63,.5)" }}>No ideas match those filters yet.</p>
          <button onClick={() => { setRegion("All"); setGrade("all"); setPage(1); }} style={{ marginTop: "16px", backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "14px", borderRadius: "9999px", padding: "11px 22px", border: "none", cursor: "pointer" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "18px" }}>
            {visible.map((idea) => (
              <div key={idea.id} style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ backgroundColor: "#F4F7FD", color: "#12306F", fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 12px" }}>{idea.region}</span>
                    <span style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 12px" }}>{idea.grade === "es" ? "Elementary" : idea.grade === "ms" ? "Middle" : "High school"}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "rgba(16,35,63,.4)" }}>{idea.ts}</span>
                </div>
                <h2 style={{ fontWeight: 700, fontSize: "18.5px", lineHeight: 1.25, letterSpacing: "-0.02em", color: "#10233F", marginBottom: "8px" }}>{idea.title}</h2>
                <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", lineHeight: 1.6, marginBottom: "18px" }}>{idea.body}</p>
                <div style={{ borderTop: "1px solid rgba(16,35,63,.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "rgba(16,35,63,.5)", fontWeight: 500 }}>{idea.school}</span>
                  <button
                    onClick={() => toggleLike(idea.id, idea.likes)}
                    style={{ fontWeight: 600, fontSize: "13px", padding: "6px 14px", borderRadius: "9999px", cursor: "pointer", border: likes[idea.id] ? "1px solid #F7941D" : "1px solid rgba(16,35,63,.18)", backgroundColor: likes[idea.id] ? "#FDEEDA" : "transparent", color: likes[idea.id] ? "#9A5405" : "rgba(16,35,63,.6)" }}
                  >
                    {likes[idea.id] ? "★" : "☆"} {idea.likes} useful
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button onClick={() => setPage(page + 1)} style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "15px", borderRadius: "9999px", padding: "13px 28px", border: "none", cursor: "pointer" }}>
                Load more ({filtered.length - visible.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.18)", borderRadius: "12px", padding: "12px 16px", fontSize: "14.5px", color: "#10233F", fontFamily: "var(--font-outfit)", width: "100%", boxSizing: "border-box", outline: "none" };
