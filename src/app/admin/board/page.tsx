import type { Metadata } from "next";

export const metadata: Metadata = { title: "Board Posts — Admin" };

const SEED_IDEAS = [
  { id: "1", title: "Chesed Buddy System for New Students", school: "Yeshiva Darchei Torah", region: "Brooklyn", grade: "hs", likes: 24, ts: "3 days ago", approved: true },
  { id: "2", title: "Bikur Cholim Letter Writing Campaign", school: "Beis Yaakov of Brooklyn", region: "Brooklyn", grade: "ms", likes: 18, ts: "1 week ago", approved: true },
  { id: "3", title: "Pre-Shabbos Food Pantry Drive", school: "Beth Medrash Govoha elementary", region: "Lakewood", grade: "es", likes: 41, ts: "2 weeks ago", approved: true },
  { id: "4", title: "Visiting Day for Local Elderly", school: "Yeshivas Tiferes Tzvi", region: "Chicago", grade: "ms", likes: 33, ts: "3 weeks ago", approved: true },
  { id: "5", title: "Kindness Shoutout Board", school: "Valley Torah", region: "Los Angeles", grade: "hs", likes: 57, ts: "1 month ago", approved: true },
  { id: "6", title: "JOC App Chesed Hours Ceremony", school: "Yeshivat Shaalvim", region: "Israel", grade: "hs", likes: 29, ts: "1 month ago", approved: true },
];

const GRADE_LABEL: Record<string, string> = { es: "Elementary", ms: "Middle", hs: "High school" };

export default function AdminBoardPage() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "6px" }}>Teachers' Board</h1>
          <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)" }}>Moderate and approve submitted ideas</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ backgroundColor: "#E8F5EE", color: "#1B7F4B", fontWeight: 700, fontSize: "13px", borderRadius: "9999px", padding: "8px 14px" }}>
            {SEED_IDEAS.filter((i) => i.approved).length} approved
          </span>
          <span style={{ backgroundColor: "#FDEEDA", color: "#9A5405", fontWeight: 700, fontSize: "13px", borderRadius: "9999px", padding: "8px 14px" }}>
            0 pending
          </span>
        </div>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1.5fr 1fr 1fr 80px", gap: "0", padding: "12px 24px", borderBottom: "1px solid rgba(16,35,63,.1)", backgroundColor: "#F8FAFE" }}>
          {["Title", "School", "Grade", "Likes", "Status"].map((col) => (
            <div key={col} style={{ fontWeight: 600, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(16,35,63,.45)" }}>
              {col}
            </div>
          ))}
        </div>
        {SEED_IDEAS.map((idea, i) => (
          <div key={idea.id} style={{ display: "grid", gridTemplateColumns: "3fr 1.5fr 1fr 1fr 80px", gap: "0", padding: "15px 24px", borderBottom: i < SEED_IDEAS.length - 1 ? "1px solid rgba(16,35,63,.07)" : "none", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14.5px", color: "#10233F", marginBottom: "2px" }}>{idea.title}</div>
              <div style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)" }}>{idea.region} · {idea.ts}</div>
            </div>
            <div style={{ fontSize: "13.5px", color: "#10233F" }}>{idea.school}</div>
            <div style={{ fontSize: "13.5px", color: "#10233F" }}>{GRADE_LABEL[idea.grade]}</div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#10233F" }}>★ {idea.likes}</div>
            <div>
              <span style={{ backgroundColor: "#E8F5EE", color: "#1B7F4B", fontWeight: 600, fontSize: "12px", borderRadius: "9999px", padding: "4px 10px" }}>
                {idea.approved ? "Live" : "Pending"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: "20px", fontSize: "13px", color: "rgba(16,35,63,.4)" }}>
        Showing static seed data. Connect the database to see real submissions and enable approve/reject actions.
      </p>
    </div>
  );
}
