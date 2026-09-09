"use client";

import Link from "next/link";
import { useState } from "react";

const CATEGORIES = [
  {
    tag: "PDF",
    title: "Worksheets",
    description: "Printable student-facing worksheets for individual and chevrusa work. Every major chesed theme covered — from hakaras hatov to ahavas Yisrael.",
    count: 214,
    unit: "sheets",
    icon: "📄",
    samples: ["Gratitude Map (Elementary)", "Chesed Reflection Journal", "Middos Self-Assessment", "Who Did I Help Today?"],
  },
  {
    tag: "ACT",
    title: "Activities",
    description: "Hands-on classroom activities with full facilitator guides, timing notes, and differentiation tips for mixed levels.",
    count: 86,
    unit: "activities",
    icon: "🎯",
    samples: ["Kindness Station Cards", "Chesed Role-Play Scenarios", "Cross-Grade Mentorship Kit", "The Attention Challenge"],
  },
  {
    tag: "PRT",
    title: "Posters & Visuals",
    description: "Classroom-ready posters, banners, and visual references. Print in any size — from letter to 36×48\" — all supplied at print resolution.",
    count: 52,
    unit: "designs",
    icon: "🖼",
    samples: ["7 Levels of Chesed (Rambam)", "Monthly Chesed Tracker", "Chesed Themes Wall Display", "Mitzvah Motivator Board"],
  },
  {
    tag: "VID",
    title: "Videos for Your Class",
    description: "Curated short videos to open a lesson, spark discussion, or close a unit. Each comes with a facilitated discussion guide.",
    count: 40,
    unit: "videos",
    icon: "▶",
    samples: ["What is Chesed? (5 min intro)", "Acts of Kindness Around the World", "Hakaras Hatov — A Story", "The 5-Minute Chesed Challenge"],
  },
  {
    tag: "SRC",
    title: "Source Sheets for Shiurim",
    description: "Prepared mekoros on chesed-related topics — hakaras hatov, gemilus chassadim, ahavas Yisrael, and more. Ready for chevrusa or frontal shiur.",
    count: 68,
    unit: "sheets",
    icon: "📖",
    samples: ["Mekoros on Gemilus Chassadim", "Rambam on Tzedakah Levels", "Bikur Cholim: Sources and Halacha", "Ahavas Yisrael — From Torah to Practice"],
  },
];

const TAG_COLORS: Record<string, string> = { PDF: "#2D46AF", ACT: "#2C7AC9", PRT: "#FA912D", VID: "#10233F", SRC: "#1B7F4B" };

export default function ResourcesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      {/* Header */}
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>RESOURCE LIBRARY</p>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#10233F", marginBottom: "14px" }}>
        Everything for the classroom,<br />all in one place.
      </h1>
      <p style={{ fontSize: "17px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "58ch", marginBottom: "16px" }}>
        460+ resources across five categories. All included in any JOC Education subscription. Sign in to download.
      </p>

      {/* Access notice */}
      <div style={{ backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "14px 20px", marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <p style={{ fontSize: "14.5px", color: "#10233F", margin: 0 }}>
          <strong>Full access</strong> is included with any JOC Education subscription.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/login" style={{ backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "13.5px", borderRadius: "9999px", padding: "10px 20px", textDecoration: "none" }}>
            Sign in to download
          </Link>
          <Link href="/pricing" style={{ backgroundColor: "transparent", color: "#2D46AF", fontWeight: 600, fontSize: "13.5px", borderRadius: "9999px", padding: "10px 20px", textDecoration: "none", border: "1px solid #2D46AF" }}>
            See plans
          </Link>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "36px", padding: "22px 28px", backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)" }}>
        {CATEGORIES.map((c) => (
          <div key={c.tag} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", backgroundColor: TAG_COLORS[c.tag], display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em" }}>{c.tag}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#10233F" }}>{c.count}</div>
              <div style={{ fontSize: "12px", color: "rgba(16,35,63,.5)" }}>{c.unit}</div>
            </div>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontWeight: 800, fontSize: "24px", letterSpacing: "-0.04em", color: "#10233F", alignSelf: "center" }}>
          {CATEGORIES.reduce((s, c) => s + c.count, 0)}<span style={{ fontWeight: 500, fontSize: "14px", color: "rgba(16,35,63,.5)", letterSpacing: 0 }}> total</span>
        </div>
      </div>

      {/* Category cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.tag}
            style={{ backgroundColor: "#fff", borderRadius: "22px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden", transition: "border-color .15s" }}
            onMouseEnter={(e) => { if (expanded !== cat.tag) (e.currentTarget as HTMLDivElement).style.borderColor = "#2D46AF"; }}
            onMouseLeave={(e) => { if (expanded !== cat.tag) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(16,35,63,.1)"; }}
          >
            {/* Card header */}
            <button
              onClick={() => setExpanded(expanded === cat.tag ? null : cat.tag)}
              style={{ width: "100%", display: "flex", gap: "20px", alignItems: "center", padding: "24px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: TAG_COLORS[cat.tag], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "12px", letterSpacing: "0.05em" }}>{cat.tag}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px" }}>
                  <h2 style={{ fontWeight: 700, fontSize: "20px", color: "#10233F", margin: 0 }}>{cat.title}</h2>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.45)" }}>{cat.count} {cat.unit}</span>
                </div>
                <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.65)", lineHeight: 1.5, margin: 0 }}>{cat.description}</p>
              </div>
              <span style={{ fontSize: "18px", color: "rgba(16,35,63,.4)", flexShrink: 0, transition: "transform .2s", transform: expanded === cat.tag ? "rotate(180deg)" : "rotate(0deg)" }}>↓</span>
            </button>

            {/* Expanded content */}
            {expanded === cat.tag && (
              <div style={{ padding: "0 24px 24px", borderTop: "1px solid rgba(16,35,63,.08)" }}>
                <p style={{ fontWeight: 600, fontSize: "12.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(16,35,63,.45)", margin: "20px 0 12px" }}>SAMPLE TITLES</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px", marginBottom: "20px" }}>
                  {cat.samples.map((s) => (
                    <div key={s} style={{ display: "flex", gap: "10px", alignItems: "center", backgroundColor: "#F8FAFE", borderRadius: "10px", padding: "12px 14px" }}>
                      <span style={{ fontSize: "15px" }}>{cat.icon}</span>
                      <span style={{ fontSize: "13.5px", color: "#10233F", fontWeight: 500 }}>{s}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "13px", color: "rgba(16,35,63,.45)", marginBottom: "16px" }}>… and {cat.count - cat.samples.length} more</p>
                <button
                  onClick={() => alert("Sign in to access the full resource library.")}
                  style={{ backgroundColor: TAG_COLORS[cat.tag], color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "11px 22px", border: "none", cursor: "pointer" }}
                >
                  Access all {cat.count} {cat.unit}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: "48px", backgroundColor: "#10233F", borderRadius: "26px", padding: "44px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "26px", color: "#fff", marginBottom: "8px" }}>Ready to access the full library?</h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,.65)", maxWidth: "50ch", lineHeight: 1.55 }}>
            Every resource is included in any JOC Education subscription. Single Teacher Use starts at $18/month.
          </p>
        </div>
        <Link href="/pricing" style={{ backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
          See plans and pricing →
        </Link>
      </div>
    </div>
  );
}
