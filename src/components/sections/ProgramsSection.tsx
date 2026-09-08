"use client";
import { useState } from "react";

const TIERS = [
  {
    key: "class",
    label: "Class-wide",
    name: "Class Chesed",
    scope: "One classroom",
    runsFor: "Weekly, all year",
    prep: "Under 10 min",
    ledBy: "Classroom teacher",
    blurb: "A sustainable weekly practice for a single class. Small enough to run without coordination across the school, meaningful enough that students feel it year-round.",
    included: ["Weekly activity prompts and reflection cards", "Printable chesed tracker for the classroom wall", "Monthly themed units tied to the Jewish calendar", "End-of-year siyum kit"],
  },
  {
    key: "grade",
    label: "Grade-wide",
    name: "Grade Chesed Challenge",
    scope: "One grade",
    runsFor: "Monthly cycles",
    prep: "One planning meeting",
    ledBy: "Grade head + teachers",
    blurb: "Monthly chesed challenges that bring an entire grade together. Teachers coordinate once; students compete and collaborate across classrooms.",
    included: ["Monthly challenge packs with facilitator guide", "Cross-class leaderboard template", "Assembly scripts and ceremony materials", "Parent communication templates"],
  },
  {
    key: "school",
    label: "School-wide",
    name: "Kindness School Program",
    scope: "Whole school",
    runsFor: "Full academic year",
    prep: "A few hours a month",
    ledBy: "Chesed coordinator",
    blurb: "A year-long school-wide culture shift. The chesed coordinator runs the program; JOC provides every material and a dedicated support contact.",
    included: ["Full curriculum scope and sequence", "All-school kickoff and monthly assembly kits", "Chesed hour tracking dashboard", "Year-end impact report and certificates", "Dedicated JOC liaison"],
  },
  {
    key: "community",
    label: "Community",
    name: "Community Chesed",
    scope: "Beyond the building",
    runsFor: "Ongoing placements",
    prep: "Coordinated by JOC",
    ledBy: "JOC + school liaison",
    blurb: "JOC connects your students to real community chesed opportunities — hospital visits, food drives, elderly companion programs — and handles all the logistics.",
    included: ["Vetted community partner network", "Placement matching and scheduling", "Volunteer hour logging for each student", "Risk management and supervision protocols", "Chesed Match integration for peer tutoring"],
  },
];

const TAB_COLORS = ["#1E47B8", "#F7941D", "#2C7AC9", "#10233F"];

export function ProgramsSection() {
  const [active, setActive] = useState(0);
  const tier = TIERS[active];

  return (
    <section id="programs" style={{ padding: "66px 26px 20px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Eyebrow */}
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>02 — CHESED PROGRAMS</p>
      <h2 style={{ fontWeight: 800, fontSize: "clamp(29px, 3.5vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "32px" }}>
        Four tiers, one mission.
      </h2>

      {/* Tab row */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
        {TIERS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setActive(i)}
            style={{
              fontWeight: 600,
              fontSize: "14.5px",
              padding: "13px 22px",
              borderRadius: "9999px",
              border: active === i ? "none" : "1px solid rgba(16,35,63,.18)",
              backgroundColor: active === i ? "#1E47B8" : "#fff",
              color: active === i ? "#fff" : "#10233F",
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div style={{ backgroundColor: "#fff", borderRadius: "26px", border: "1px solid rgba(16,35,63,.1)", padding: "34px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "34px" }}>
        {/* Left */}
        <div>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "8px" }}>{tier.scope}</p>
          <h3 style={{ fontWeight: 700, fontSize: "31px", lineHeight: 1.08, letterSpacing: "-0.03em", color: "#10233F", marginBottom: "12px" }}>{tier.name}</h3>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.72)", lineHeight: 1.6, marginBottom: "24px" }}>{tier.blurb}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
            {[["Runs for", tier.runsFor], ["Prep", tier.prep], ["Led by", tier.ledBy]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", gap: "12px", fontSize: "14.5px" }}>
                <span style={{ color: "rgba(16,35,63,.55)", minWidth: "72px" }}>{label}</span>
                <span style={{ color: "#10233F", fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
          <button style={{ backgroundColor: "#1E47B8", color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", border: "none", cursor: "pointer" }}>
            Register for {tier.label}
          </button>
        </div>

        {/* Right */}
        <div style={{ backgroundColor: "#F4F7FD", borderRadius: "20px", padding: "24px" }}>
          <p style={{ fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#10233F", marginBottom: "16px" }}>WHAT'S INCLUDED</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tier.included.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: i < tier.included.length - 1 ? "1px solid rgba(16,35,63,.08)" : "none" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F7941D", flexShrink: 0, marginTop: "5px" }} />
                <span style={{ fontSize: "15px", color: "#10233F", lineHeight: 1.5 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
