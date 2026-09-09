"use client";

const CATEGORIES = [
  { tag: "PDF", title: "Worksheets", description: "Printable student-facing worksheets for individual and chevrusa work. Every major theme covered.", count: 214, unit: "sheets" },
  { tag: "ACT", title: "Activities", description: "Hands-on classroom activities with facilitator guides, timing notes, and differentiation tips.", count: 86, unit: "activities" },
  { tag: "PRT", title: "Posters & Visuals", description: "Classroom-ready posters, banners, and visual references. Print in any size.", count: 52, unit: "designs" },
  { tag: "VID", title: "Videos for Your Class", description: "Curated short videos to open a lesson, spark discussion, or close a unit. Each with a discussion guide.", count: 40, unit: "videos" },
  { tag: "SRC", title: "Source Sheets for Shiurim", description: "Prepared mekoros on chesed-related topics — hakaras hatov, gemilus chassadim, and more.", count: 68, unit: "sheets" },
];

export function ResourceLibrarySection() {
  return (
    <section style={{ padding: "66px 26px 20px", maxWidth: "1280px", margin: "0 auto" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>04 — RESOURCE LIBRARY</p>
      <h2 style={{ fontWeight: 800, fontSize: "clamp(29px, 3.5vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "28px" }}>
        Everything for the classroom, all in one place.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.tag}
            style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid rgba(16,35,63,.1)", padding: "24px", transition: "border-color .15s, box-shadow .15s", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2D46AF"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 26px rgba(16,35,63,.11)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(16,35,63,.1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#2D46AF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "11px", letterSpacing: "0.05em" }}>{cat.tag}</span>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "18px", color: "#10233F", marginBottom: "8px" }}>{cat.title}</h3>
            <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", lineHeight: 1.55, marginBottom: "16px" }}>{cat.description}</p>
            <p style={{ fontWeight: 600, fontSize: "13px", color: "#C96C00" }}>{cat.count} {cat.unit}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
