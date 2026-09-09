"use client";
import { useState } from "react";

const SEED_IDEAS = [
  { id: "1", title: "Chesed Buddy System for New Students", body: "Paired every new student with a 'chesed buddy' for the first month. The buddy introduced them around, sat with them at lunch, and showed them the ropes. End-of-year survey: new students felt settled within two weeks on average.", region: "Brooklyn", school: "Yeshiva Darchei Torah", ts: "3 days ago", likes: 24 },
  { id: "2", title: "Bikur Cholim Letter Writing Campaign", body: "Had the whole grade write personal letters to hospital patients at Maimonides. Coordinated with a local volunteer group to deliver them. Students were moved when volunteers reported back on the reactions.", region: "Brooklyn", school: "Beis Yaakov of Brooklyn", ts: "1 week ago", likes: 18 },
  { id: "3", title: "Pre-Shabbos Food Pantry Drive", body: "Every Friday morning, a rotating class collects non-perishables for the local food pantry. Simple, predictable, and the kids own it. Now in its third year.", region: "Lakewood", school: "Beth Medrash Govoha elementary", ts: "2 weeks ago", likes: 41 },
  { id: "4", title: "Visiting Day for Local Elderly", body: "Partnered with the local senior center for monthly class visits. Students prepare a short Torah vort and bring mishloach manos-style packages. The seniors and students both look forward to it.", region: "Chicago", school: "Yeshivas Tiferes Tzvi", ts: "3 weeks ago", likes: 33 },
  { id: "5", title: "Kindness Shoutout Board", body: "Set up a board in the hallway where students can post anonymous notes about acts of chesed they observed. Changed the social dynamics in the school in a way I didn't expect.", region: "Los Angeles", school: "Valley Torah", ts: "1 month ago", likes: 57 },
  { id: "6", title: "JOC App Chesed Hours Ceremony", body: "At the end of every month, we do a brief in-class ceremony for students who logged 10+ chesed hours on the JOC App. A certificate and a two-minute sharing. Motivation went up significantly.", region: "Israel", school: "Yeshivat Shaalvim", ts: "1 month ago", likes: 29 },
  { id: "7", title: "Cross-Grade Chesed Mentorship", body: "Ninth graders mentor third graders on a monthly basis. They plan and run a chesed activity together. Both grades show up differently.", region: "Toronto", school: "Or Chaim Day School", ts: "6 weeks ago", likes: 22 },
  { id: "8", title: "Chesed Goal Cards for Rosh Hashana", body: "Before Rosh Hashana, each student writes one concrete chesed goal for the coming year on an index card. We seal them in envelopes and return them before Pesach for a check-in. Simple and powerful.", region: "Miami", school: "Scheck Hillel Community School", ts: "2 months ago", likes: 38 },
];

const ALL_REGIONS = ["All", ...Array.from(new Set(SEED_IDEAS.map((i) => i.region))).sort()];

export function TeachersBoardSection() {
  const [region, setRegion] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [ideas, setIdeas] = useState(SEED_IDEAS);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [fTitle, setFTitle] = useState("");
  const [fSchool, setFSchool] = useState("");
  const [fRegion, setFRegion] = useState("Brooklyn");
  const [fBody, setFBody] = useState("");

  const filtered = region === "All" ? ideas : ideas.filter((i) => i.region === region);

  function submitIdea() {
    if (!fTitle.trim()) return;
    const newIdea = { id: String(Date.now()), title: fTitle, body: fBody, region: fRegion, school: fSchool || "Anonymous", ts: "Just now", likes: 0 };
    setIdeas([newIdea, ...ideas]);
    setRegion(fRegion);
    setShowForm(false);
    setFTitle(""); setFSchool(""); setFBody(""); setFRegion("Brooklyn");
  }

  function toggleLike(id: string, currentLikes: number) {
    const wasLiked = likes[id];
    setLikes({ ...likes, [id]: !wasLiked });
    setIdeas(ideas.map((i) => i.id === id ? { ...i, likes: currentLikes + (wasLiked ? -1 : 1) } : i));
  }

  return (
    <section style={{ padding: "66px 26px 20px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>05 — TEACHERS' BOARD</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(29px, 3.5vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "8px" }}>What other schools are running.</h2>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.72)", lineHeight: 1.6 }}>Teachers share what they actually ran. Filter by region to find ideas from nearby schools.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "13px 22px", border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {showForm ? "Close" : "+ Share an idea"}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div style={{ backgroundColor: "#fff", border: "2px solid #FA912D", borderRadius: "20px", padding: "24px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Idea title (required)" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input value={fSchool} onChange={(e) => setFSchool(e.target.value)} placeholder="School name (optional)" style={inputStyle} />
            <select value={fRegion} onChange={(e) => setFRegion(e.target.value)} style={inputStyle}>
              {ALL_REGIONS.filter((r) => r !== "All").map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <textarea value={fBody} onChange={(e) => setFBody(e.target.value)} placeholder="Describe what you ran — the more detail, the more useful it is to other teachers." rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={submitIdea} style={{ alignSelf: "flex-start", backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 24px", border: "none", cursor: "pointer" }}>
            Post to the board
          </button>
        </div>
      )}

      {/* Region filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
        {ALL_REGIONS.map((r) => (
          <button key={r} onClick={() => setRegion(r)} style={{ fontWeight: 600, fontSize: "13.5px", padding: "10px 16px", borderRadius: "9999px", border: region === r ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.2)", backgroundColor: region === r ? "#10233F" : "#fff", color: region === r ? "#fff" : "#10233F", cursor: "pointer" }}>
            {r}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
        {filtered.map((idea) => (
          <div key={idea.id} style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ backgroundColor: "#F4F7FD", color: "#12306F", fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 12px" }}>{idea.region}</span>
              <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.45)" }}>{idea.ts}</span>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "19.5px", lineHeight: 1.22, letterSpacing: "-0.025em", color: "#10233F", marginBottom: "8px" }}>{idea.title}</h3>
            <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", lineHeight: 1.55, marginBottom: "16px" }}>{idea.body}</p>
            <div style={{ borderTop: "1px solid rgba(16,35,63,.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "rgba(16,35,63,.55)" }}>{idea.school}</span>
              <button
                onClick={() => toggleLike(idea.id, idea.likes)}
                style={{
                  fontWeight: 600, fontSize: "13px", padding: "6px 14px", borderRadius: "9999px", cursor: "pointer", border: likes[idea.id] ? "1px solid #FA912D" : "1px solid rgba(16,35,63,.2)",
                  backgroundColor: likes[idea.id] ? "#FDEEDA" : "transparent",
                  color: likes[idea.id] ? "#9A5405" : "rgba(16,35,63,.62)",
                }}
              >
                {likes[idea.id] ? "★" : "☆"} {idea.likes} useful
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = { backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.2)", borderRadius: "12px", padding: "12px 16px", fontSize: "14.5px", color: "#10233F", fontFamily: "var(--font-outfit)", width: "100%", boxSizing: "border-box", outline: "none" };
