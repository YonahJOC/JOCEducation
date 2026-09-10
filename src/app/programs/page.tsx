"use client";

import Link from "next/link";
import { useState } from "react";
import { PROGRAMS } from "@/lib/programs";

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
    color: "#2D46AF",
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
    color: "#FA912D",
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
    color: "#2C7AC9",
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
    color: "#10233F",
  },
];

export default function ProgramsPage() {
  const [active, setActive] = useState(0);
  const tier = TIERS[active];

  return (
    <div>
      {/* Hero */}
      <div style={{ backgroundColor: "#10233F", padding: "64px 26px 56px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#FA912D", marginBottom: "12px" }}>CHESED PROGRAMS</p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 54px)", lineHeight: 1.04, letterSpacing: "-0.04em", color: "#fff", maxWidth: "14ch", marginBottom: "18px" }}>
            Four tiers, one mission.
          </h1>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,.7)", lineHeight: 1.6, maxWidth: "52ch" }}>
            From a single classroom to the whole school — JOC Education has a chesed program for where your school is right now, and where you want to go.
          </p>
        </div>
      </div>

      {/* Tier selector */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "52px 26px 0" }}>
        <h2 style={{ fontWeight: 700, fontSize: "13px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(16,35,63,.5)", marginBottom: "16px" }}>Choose your program scope</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
          {TIERS.map((t, i) => (
            <button
              key={t.key}
              onClick={() => setActive(i)}
              style={{
                fontWeight: 600, fontSize: "14.5px", padding: "12px 22px", borderRadius: "9999px",
                border: active === i ? "none" : "1px solid rgba(16,35,63,.18)",
                backgroundColor: active === i ? "#2D46AF" : "#fff",
                color: active === i ? "#fff" : "#10233F",
                cursor: "pointer", transition: "all .15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tier panel */}
        <div style={{ backgroundColor: "#fff", borderRadius: "26px", border: "1px solid rgba(16,35,63,.1)", padding: "34px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "34px", marginBottom: "64px" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "8px" }}>{tier.scope}</p>
            <h2 style={{ fontWeight: 700, fontSize: "31px", lineHeight: 1.08, letterSpacing: "-0.03em", color: "#10233F", marginBottom: "12px" }}>{tier.name}</h2>
            <p style={{ fontSize: "15px", color: "rgba(16,35,63,.72)", lineHeight: 1.6, marginBottom: "24px" }}>{tier.blurb}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
              {[["Runs for", tier.runsFor], ["Prep", tier.prep], ["Led by", tier.ledBy]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: "12px", fontSize: "14.5px" }}>
                  <span style={{ color: "rgba(16,35,63,.5)", minWidth: "72px" }}>{label}</span>
                  <span style={{ color: "#10233F", fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
            <Link href="/pricing" style={{ display: "inline-block", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", textDecoration: "none" }}>
              See pricing
            </Link>
          </div>
          <div style={{ backgroundColor: "#F4F7FD", borderRadius: "20px", padding: "24px" }}>
            <p style={{ fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#10233F", marginBottom: "16px" }}>WHAT'S INCLUDED</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {tier.included.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 0", borderBottom: i < tier.included.length - 1 ? "1px solid rgba(16,35,63,.08)" : "none" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FA912D", flexShrink: 0, marginTop: "5px" }} />
                  <span style={{ fontSize: "15px", color: "#10233F", lineHeight: 1.5 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* JOC Programs */}
        <div style={{ marginBottom: "64px" }}>
          <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "10px" }}>JOC-ORGANIZED PROGRAMS</p>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 38px)", lineHeight: 1.06, letterSpacing: "-0.03em", color: "#10233F", marginBottom: "8px" }}>
            Programs JOC runs for your school.
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, maxWidth: "60ch", marginBottom: "32px" }}>
            Beyond the in-class curriculum, JOC runs a set of organized programs your school can register for. Availability depends on your subscription level.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
            {PROGRAMS.map((p) => (
              <div key={p.slug} style={{ backgroundColor: "#fff", borderRadius: "22px", border: "1px solid rgba(16,35,63,.1)", padding: "26px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ backgroundColor: "#F4F7FD", color: "#12306F", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 12px" }}>{p.tag}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "21px", color: "#10233F", marginBottom: "10px" }}>{p.name}</h3>
                <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.7)", lineHeight: 1.6, marginBottom: "12px", flex: 1 }}>{p.description}</p>
                <p style={{ fontSize: "12.5px", color: "#C96C00", fontWeight: 600, marginBottom: "20px" }}>{p.meta}</p>
                <div style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", marginBottom: "20px" }}>
                  <span style={{ fontWeight: 600 }}>Included with: </span>{p.available.join(", ")}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link href={`/programs/${p.slug}`} style={{ flex: 1, display: "block", textAlign: "center", backgroundColor: "#F4F7FD", color: "#10233F", fontWeight: 600, fontSize: "13.5px", borderRadius: "9999px", padding: "10px 16px", textDecoration: "none" }}>
                    Learn more
                  </Link>
                  {p.external ? (
                    <a href={p.externalHref} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "block", textAlign: "center", backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "13.5px", borderRadius: "9999px", padding: "10px 16px", textDecoration: "none" }}>
                      Visit ↗
                    </a>
                  ) : (
                    <Link href="/pricing" style={{ flex: 1, display: "block", textAlign: "center", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "13.5px", borderRadius: "9999px", padding: "10px 16px", textDecoration: "none" }}>
                      Register
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA band */}
        <div style={{ backgroundColor: "#2D46AF", borderRadius: "26px", padding: "44px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px", marginBottom: "40px" }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "8px" }}>Ready to bring JOC to your school?</h2>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,.72)", maxWidth: "52ch", lineHeight: 1.55 }}>
              Most schools start with JOC App + JOC Education. Choose your plan and you're up and running within a week.
            </p>
          </div>
          <Link href="/pricing" style={{ backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none", whiteSpace: "nowrap" }}>
            See pricing →
          </Link>
        </div>
      </div>
    </div>
  );
}
