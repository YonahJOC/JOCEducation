"use client";

import Link from "next/link";
import { useState } from "react";

const SAVED_LESSONS = [
  { id: 1, title: "Seeing the Person in Front of You", theme: "Bein Adam LaChaveiro", grade: "es", time: 20, color: "#2D46AF" },
  { id: 5, title: "Who Do You Thank?", theme: "Hakaras Hatov", grade: "es", time: 20, color: "#FA912D" },
  { id: 8, title: "Small Acts, Big Difference", theme: "Kindness in Action", grade: "es", time: 60, color: "#2C7AC9" },
];

const ACTIVITY_FEED = [
  { type: "lesson", text: "New lesson added: \"The Courage to Give\" (High school, 60 min)", ts: "2 days ago" },
  { type: "board", text: "Yeshiva Darchei Torah posted a new idea: \"Chesed Buddy System\"", ts: "3 days ago" },
  { type: "program", text: "Bake for Chesed — November cycle materials are ready", ts: "5 days ago" },
  { type: "lesson", text: "Updated: \"Mekoros on Chesed\" now includes teacher notes", ts: "1 week ago" },
  { type: "resource", text: "New resource pack: Chanukah Chesed Activities (6 worksheets)", ts: "1 week ago" },
];

const ACTIVE_PROGRAMS = [
  { name: "Bake for Chesed", status: "Active — November cycle", color: "#2D46AF" },
  { name: "JOC App", status: "42 students enrolled", color: "#FA912D" },
];

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "programs" | "resources">("overview");

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 26px 72px" }}>
      {/* Welcome bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
        <div>
          <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.55)", fontWeight: 600, marginBottom: "4px" }}>
            Beis Yaakov of Brooklyn · JOC App + JOC Education
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 38px)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "#10233F", marginBottom: "0" }}>
            Welcome back, Ms. Cohen
          </h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/lesson-plans" style={{ display: "inline-block", backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "14px", borderRadius: "9999px", padding: "11px 20px", textDecoration: "none" }}>
            Browse lessons
          </Link>
          <Link href="/board" style={{ display: "inline-block", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "11px 20px", textDecoration: "none" }}>
            Teachers' Board
          </Link>
        </div>
      </div>

      {/* Auth notice */}
      <div style={{ backgroundColor: "#FDEEDA", borderRadius: "14px", padding: "14px 20px", marginBottom: "28px", display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "18px" }}>ℹ</span>
        <p style={{ fontSize: "14px", color: "#7C4A00", lineHeight: 1.5, margin: 0 }}>
          <strong>Preview mode.</strong> Auth isn't connected yet — this dashboard shows what a logged-in teacher would see. Data is illustrative.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "36px" }}>
        {[
          { label: "Saved lessons", value: "12", icon: "📚" },
          { label: "Chesed hours this year", value: "847", icon: "⏱" },
          { label: "Active programs", value: "2", icon: "🌟" },
          { label: "Board posts liked", value: "36", icon: "★" },
        ].map((stat) => (
          <div key={stat.label} style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "22px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "22px" }}>{stat.icon}</span>
            <div style={{ fontWeight: 800, fontSize: "30px", letterSpacing: "-0.04em", color: "#10233F" }}>{stat.value}</div>
            <div style={{ fontSize: "13px", color: "rgba(16,35,63,.55)", fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", backgroundColor: "#fff", borderRadius: "14px", border: "1px solid rgba(16,35,63,.1)", padding: "6px", width: "fit-content" }}>
        {([["overview", "Overview"], ["lessons", "Saved lessons"], ["programs", "Programs"], ["resources", "Resources"]] as [typeof activeTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{ fontWeight: 600, fontSize: "13.5px", padding: "9px 18px", borderRadius: "10px", border: "none", cursor: "pointer", backgroundColor: activeTab === key ? "#10233F" : "transparent", color: activeTab === key ? "#fff" : "rgba(16,35,63,.65)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Activity feed */}
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "16px" }}>Recent activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {ACTIVITY_FEED.map((item, i) => (
                <div key={i} style={{ backgroundColor: "#fff", borderRadius: "14px", border: "1px solid rgba(16,35,63,.08)", padding: "14px 18px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.type === "lesson" ? "📄" : item.type === "board" ? "💬" : item.type === "program" ? "🌟" : "📦"}</span>
                  <div>
                    <p style={{ fontSize: "14px", color: "#10233F", lineHeight: 1.5, margin: "0 0 3px" }}>{item.text}</p>
                    <p style={{ fontSize: "12px", color: "rgba(16,35,63,.45)", margin: 0 }}>{item.ts}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Active programs */}
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "16px" }}>Active programs</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {ACTIVE_PROGRAMS.map((p) => (
                  <div key={p.name} style={{ backgroundColor: "#fff", borderRadius: "14px", border: "1px solid rgba(16,35,63,.08)", padding: "16px 18px", display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: p.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: "14.5px", color: "#10233F", margin: "0 0 2px" }}>{p.name}</p>
                      <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", margin: 0 }}>{p.status}</p>
                    </div>
                    <Link href="/programs" style={{ fontSize: "13px", color: "#2D46AF", fontWeight: 600, textDecoration: "none" }}>View →</Link>
                  </div>
                ))}
                <Link href="/programs" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: "12px", border: "1.5px dashed rgba(16,35,63,.18)", fontSize: "13.5px", color: "rgba(16,35,63,.55)", textDecoration: "none", fontWeight: 500 }}>
                  + Register for more programs
                </Link>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", marginBottom: "16px" }}>Quick links</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Browse Lessons", href: "/lesson-plans", icon: "📚" },
                  { label: "Resources", href: "/resources", icon: "📦" },
                  { label: "Teachers' Board", href: "/board", icon: "💬" },
                  { label: "School Shop", href: "/shop", icon: "🛒" },
                ].map((q) => (
                  <Link key={q.href} href={q.href} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", backgroundColor: "#fff", borderRadius: "14px", border: "1px solid rgba(16,35,63,.08)", textDecoration: "none", transition: "border-color .15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#2D46AF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(16,35,63,.08)"; }}
                  >
                    <span style={{ fontSize: "20px" }}>{q.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: "13.5px", color: "#10233F" }}>{q.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "lessons" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "18px", color: "#10233F" }}>Saved lessons ({SAVED_LESSONS.length})</h2>
            <Link href="/lesson-plans" style={{ fontSize: "14px", color: "#2D46AF", fontWeight: 600, textDecoration: "none" }}>Browse all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {SAVED_LESSONS.map((l) => (
              <Link key={l.id} href={`/lesson-plans/${l.id}`} style={{ display: "block", textDecoration: "none", backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", overflow: "hidden" }}>
                <div style={{ height: "6px", backgroundColor: l.color }} />
                <div style={{ padding: "18px" }}>
                  <span style={{ display: "inline-block", backgroundColor: "#F4F7FD", color: "#2D46AF", fontWeight: 700, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 10px", marginBottom: "8px" }}>{l.theme}</span>
                  <h3 style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", lineHeight: 1.25, marginBottom: "8px" }}>{l.title}</h3>
                  <p style={{ fontSize: "13px", color: "rgba(16,35,63,.5)" }}>{l.grade === "es" ? "Elementary" : l.grade === "ms" ? "Middle" : "High school"} · {l.time} min</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeTab === "programs" && (
        <div>
          <h2 style={{ fontWeight: 700, fontSize: "18px", color: "#10233F", marginBottom: "20px" }}>Your programs</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ACTIVE_PROGRAMS.map((p) => (
              <div key={p.name} style={{ backgroundColor: "#fff", borderRadius: "18px", border: "1px solid rgba(16,35,63,.1)", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: p.color }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "17px", color: "#10233F", margin: "0 0 4px" }}>{p.name}</p>
                    <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)", margin: 0 }}>{p.status}</p>
                  </div>
                </div>
                <Link href="/programs" style={{ backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "14px", borderRadius: "9999px", padding: "10px 20px", textDecoration: "none" }}>
                  Manage
                </Link>
              </div>
            ))}
            <Link href="/programs" style={{ display: "block", padding: "20px", borderRadius: "18px", border: "2px dashed rgba(16,35,63,.18)", textAlign: "center", fontSize: "14.5px", color: "#2D46AF", textDecoration: "none", fontWeight: 600 }}>
              + Add a program
            </Link>
          </div>
        </div>
      )}

      {activeTab === "resources" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "18px", color: "#10233F" }}>Resources</h2>
            <Link href="/resources" style={{ fontSize: "14px", color: "#2D46AF", fontWeight: 600, textDecoration: "none" }}>Browse library →</Link>
          </div>
          <div style={{ backgroundColor: "#F4F7FD", borderRadius: "18px", padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, marginBottom: "20px" }}>
              Your subscription gives you access to 460+ worksheets, activities, posters, videos, and source sheets.
            </p>
            <Link href="/resources" style={{ display: "inline-block", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "13px 26px", textDecoration: "none" }}>
              Browse the resource library
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
