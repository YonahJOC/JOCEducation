import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resources — Admin" };

const CATEGORIES = [
  { tag: "PDF", title: "Worksheets", count: 214 },
  { tag: "ACT", title: "Activities", count: 86 },
  { tag: "PRT", title: "Posters & Visuals", count: 52 },
  { tag: "VID", title: "Videos for Your Class", count: 40 },
  { tag: "SRC", title: "Source Sheets for Shiurim", count: 68 },
];

export default function AdminResourcesPage() {
  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "6px" }}>Resources</h1>
          <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)" }}>460+ resources across 5 categories</p>
        </div>
        <button style={{ backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 22px", border: "none", cursor: "pointer" }}>
          + Add resource
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px", marginBottom: "32px" }}>
        {CATEGORIES.map((cat) => (
          <div key={cat.tag} style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid rgba(16,35,63,.1)", padding: "22px" }}>
            <div style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "0.18em", color: "rgba(16,35,63,.4)", textTransform: "uppercase", marginBottom: "8px" }}>{cat.tag}</div>
            <div style={{ fontWeight: 700, fontSize: "22px", color: "#10233F", letterSpacing: "-0.035em", marginBottom: "4px" }}>{cat.count}</div>
            <div style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)" }}>{cat.title}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "14px" }}>🔌</div>
        <h2 style={{ fontWeight: 700, fontSize: "18px", color: "#10233F", marginBottom: "8px" }}>Connect the database to manage resources</h2>
        <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.6)", lineHeight: 1.6 }}>
          Once the database is connected, individual resources (with file URLs, tags, and metadata) will be listed and editable here.
        </p>
      </div>
    </div>
  );
}
