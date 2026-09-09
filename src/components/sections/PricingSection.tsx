"use client";
import { useState } from "react";

type Billing = "monthly" | "annual";
type Size = "s" | "m" | "l";
type Plan = "" | "teacher" | "staff" | "app" | "full";

const ENROLLMENT_LABELS: Record<Size, string> = { s: "Under 150 students", m: "150–400", l: "400+" };

const BASE_PRICES: Record<string, Record<Size, number>> = {
  teacher: { s: 18, m: 18, l: 18 },
  staff:   { s: 180, m: 290, l: 420 },
  app:     { s: 295, m: 440, l: 610 },
};

function price(key: "teacher" | "staff" | "app", size: Size, billing: Billing) {
  const monthly = BASE_PRICES[key][size];
  return billing === "annual" ? Math.round(monthly * 0.85) : monthly;
}

type PriceTier = "none" | "teacher" | "staff" | "app" | "full";

const PROGRAMS: { label: string; prices: Record<PriceTier, { cents?: number; included?: boolean; na?: boolean }> }[] = [
  { label: "Kindness Booth", prices: { none: { cents: 249 * 100 }, teacher: { cents: 199 * 100 }, staff: { cents: 149 * 100 }, app: { included: true }, full: { included: true } } },
  { label: "Bake for Chesed", prices: { none: { cents: 150 * 100 }, teacher: { cents: 120 * 100 }, staff: { included: true }, app: { included: true }, full: { included: true } } },
  { label: "Just One Tutor", prices: { none: { cents: 200 * 100 }, teacher: { na: true }, staff: { cents: 150 * 100 }, app: { included: true }, full: { included: true } } },
  { label: "Chesed Match placements", prices: { none: { cents: 100 * 100 }, teacher: { na: true }, staff: { na: true }, app: { cents: 75 * 100 }, full: { included: true } } },
  { label: "JOC Center trip (Israel)", prices: { none: { cents: 350 * 100 }, teacher: { na: true }, staff: { na: true }, app: { na: true }, full: { included: true } } },
  { label: "Assembly or launch event", prices: { none: { cents: 500 * 100 }, teacher: { cents: 400 * 100 }, staff: { cents: 300 * 100 }, app: { cents: 200 * 100 }, full: { included: true } } },
];

const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  none: "No subscription", teacher: "Single Teacher Use", staff: "JOC Education", app: "JOC App + JOC Education", full: "Full JOC Partnership",
};

export function PricingSection() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [sizeKey, setSizeKey] = useState<Size>("s");
  const [plan, setPlan] = useState<Plan>("");
  const [priceTier, setPriceTier] = useState<PriceTier>("none");

  const tiers: PriceTier[] = ["none", "teacher", "staff", "app", "full"];

  return (
    <section id="pricing" style={{ padding: "66px 26px 20px", maxWidth: "1280px", margin: "0 auto" }}>
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>06 — BRING JOC TO YOUR SCHOOL</p>
      <h2 style={{ fontWeight: 800, fontSize: "clamp(29px, 3.5vw, 44px)", lineHeight: 1.06, letterSpacing: "-0.035em", color: "#10233F", marginBottom: "32px" }}>Membership & Pricing</h2>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginBottom: "28px" }}>
        {/* Billing toggle */}
        <div style={{ display: "inline-flex", backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.15)", borderRadius: "9999px", padding: "5px", gap: "2px" }}>
          {(["annual", "monthly"] as Billing[]).map((b) => (
            <button key={b} onClick={() => setBilling(b)} style={{ fontWeight: 600, fontSize: "13.5px", padding: "8px 18px", borderRadius: "9999px", border: "none", cursor: "pointer", backgroundColor: billing === b ? "#10233F" : "transparent", color: billing === b ? "#fff" : "#10233F" }}>
              {b === "annual" ? "Annual · save 15%" : "Monthly"}
            </button>
          ))}
        </div>
        {/* Enrollment chips */}
        <div style={{ display: "flex", gap: "8px" }}>
          {(["s", "m", "l"] as Size[]).map((s) => (
            <button key={s} onClick={() => setSizeKey(s)} style={{ fontWeight: 600, fontSize: "13.5px", padding: "10px 16px", borderRadius: "9999px", border: sizeKey === s ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.2)", backgroundColor: sizeKey === s ? "#10233F" : "#fff", color: sizeKey === s ? "#fff" : "#10233F", cursor: "pointer" }}>
              {ENROLLMENT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(258px, 1fr))", gap: "16px", marginBottom: "16px" }}>
        <PlanCard title="Single Teacher Use" subtitle="One login, full library" monthlyPrice={price("teacher", sizeKey, billing)} billing={billing} highlight={false} badge={null} features={["Full lesson plan library", "All downloadable resources", "Teachers' Board posting", "Lesson plan favorites"]} selected={plan === "teacher"} onSelect={() => setPlan(plan === "teacher" ? "" : "teacher")} />
        <PlanCard title="JOC Education" subtitle="Every teacher in one building" monthlyPrice={price("staff", sizeKey, billing)} billing={billing} highlight={false} badge={null} features={["Everything in Single Teacher Use", "Unlimited staff logins", "Program frameworks and guides", "Faculty onboarding session", "School chesed dashboard"]} selected={plan === "staff"} onSelect={() => setPlan(plan === "staff" ? "" : "staff")} />
        <PlanCard title="JOC App + JOC Education" subtitle="Adds the student JOC App" monthlyPrice={price("app", sizeKey, billing)} billing={billing} highlight={true} badge="MOST SCHOOLS" features={["Everything in JOC Education", "Student JOC App registration", "Chesed hour logging", "School-wide impact dashboard", "Year-end impact report"]} selected={plan === "app"} onSelect={() => setPlan(plan === "app" ? "" : "app")} />
      </div>

      {/* Full Partnership band */}
      <div style={{ backgroundColor: "#10233F", borderRadius: "26px", padding: "36px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "32px", marginBottom: "24px", alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-block", backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.16em", textTransform: "uppercase", borderRadius: "9999px", padding: "5px 14px", marginBottom: "12px" }}>ANNUAL PARTNERSHIP</span>
          <h3 style={{ fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "4px" }}>Full JOC Partnership</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 800, fontSize: "48px", letterSpacing: "-0.04em", color: "#fff" }}>$3,600</span>
            <span style={{ color: "rgba(255,255,255,.55)", fontSize: "15px" }}>/ year</span>
          </div>
          <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,.55)", marginBottom: "20px" }}>Flat rate, any enrollment</p>
          <button
            onClick={() => setPlan(plan === "full" ? "" : "full")}
            style={{ backgroundColor: plan === "full" ? "transparent" : "#FA912D", color: plan === "full" ? "#fff" : "#10233F", border: plan === "full" ? "2px solid rgba(255,255,255,.4)" : "none", fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px 26px", cursor: "pointer" }}
          >
            {plan === "full" ? "Selected ✓" : "Choose this"}
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
          {["Everything in JOC App + JOC Education", "Kindness Booth included", "Just One Tutor peer placements", "Chesed Match student placements", "Bake for Chesed program", "Dedicated JOC school liaison"].map((f) => (
            <li key={f} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14.5px", color: "rgba(255,255,255,.8)" }}>
              <span style={{ color: "#FA912D", flexShrink: 0 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Per-program table */}
      <div style={{ backgroundColor: "#fff", borderRadius: "26px", border: "1px solid rgba(16,35,63,.1)", padding: "32px", marginBottom: "16px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "19.5px", color: "#10233F", marginBottom: "16px" }}>Per-program pricing</h3>
        {/* Tier toggle */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          {tiers.map((t) => (
            <button key={t} onClick={() => setPriceTier(t)} style={{ fontWeight: 600, fontSize: "13px", padding: "9px 16px", borderRadius: "9999px", border: priceTier === t ? "1.5px solid #10233F" : "1px solid rgba(16,35,63,.2)", backgroundColor: priceTier === t ? "#10233F" : "#fff", color: priceTier === t ? "#fff" : "#10233F", cursor: "pointer" }}>
              {PRICE_TIER_LABELS[t]}
            </button>
          ))}
        </div>
        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", fontWeight: 600, fontSize: "13px", color: "rgba(16,35,63,.55)", paddingBottom: "12px", borderBottom: "1px solid rgba(16,35,63,.08)", paddingRight: "24px" }}>Program</th>
                <th style={{ textAlign: "right", fontWeight: 600, fontSize: "13px", color: "rgba(16,35,63,.55)", paddingBottom: "12px", borderBottom: "1px solid rgba(16,35,63,.08)", minWidth: "140px" }}>No subscription</th>
                <th style={{ textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#10233F", paddingBottom: "12px", borderBottom: "1px solid rgba(16,35,63,.08)", minWidth: "160px" }}>{PRICE_TIER_LABELS[priceTier]}</th>
              </tr>
            </thead>
            <tbody>
              {PROGRAMS.map((prog, i) => {
                const noSubPrice = prog.prices.none.cents!;
                const tierPrice = prog.prices[priceTier];
                return (
                  <tr key={prog.label}>
                    <td style={{ fontSize: "14.5px", color: "#10233F", padding: "14px 0", paddingRight: "24px", borderBottom: i < PROGRAMS.length - 1 ? "1px solid rgba(16,35,63,.06)" : "none" }}>{prog.label}</td>
                    <td style={{ textAlign: "right", fontSize: "14.5px", color: "rgba(16,35,63,.55)", padding: "14px 0", borderBottom: i < PROGRAMS.length - 1 ? "1px solid rgba(16,35,63,.06)" : "none" }}>
                      {tierPrice.cents && tierPrice.cents < noSubPrice ? <span style={{ textDecoration: "line-through" }}>${noSubPrice / 100}</span> : `$${noSubPrice / 100}`}
                    </td>
                    <td style={{ textAlign: "right", padding: "14px 0", borderBottom: i < PROGRAMS.length - 1 ? "1px solid rgba(16,35,63,.06)" : "none" }}>
                      {priceTier === "none" ? (
                        <span style={{ fontSize: "14.5px", color: "rgba(16,35,63,.55)" }}>—</span>
                      ) : tierPrice.na ? (
                        <span style={{ fontSize: "14.5px", color: "rgba(16,35,63,.55)" }}>Not available</span>
                      ) : tierPrice.included ? (
                        <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#1B7F4B" }}>Included</span>
                      ) : (
                        <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#2D46AF" }}>${(tierPrice.cents! / 100)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scholarship panel */}
      <div style={{ backgroundColor: "#F4F7FD", borderRadius: "18px", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "16px", color: "#10233F", marginBottom: "6px" }}>Need financial assistance?</p>
          <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.72)", maxWidth: "52ch" }}>No school is turned away on cost. We offer full and partial scholarships to qualifying schools.</p>
        </div>
        <button style={{ backgroundColor: "#10233F", color: "#fff", fontWeight: 700, fontSize: "14px", borderRadius: "9999px", padding: "12px 24px", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
          Apply for a scholarship
        </button>
      </div>
    </section>
  );
}

function PlanCard({ title, subtitle, monthlyPrice, billing, highlight, badge, features, selected, onSelect }: { title: string; subtitle: string; monthlyPrice: number; billing: Billing; highlight: boolean; badge: string | null; features: string[]; selected: boolean; onSelect: () => void; }) {
  return (
    <div style={{ backgroundColor: highlight ? "#2D46AF" : "#fff", borderRadius: "24px", border: highlight ? "none" : "1px solid rgba(16,35,63,.1)", padding: "26px", position: "relative", display: "flex", flexDirection: "column" }}>
      {badge && <span style={{ position: "absolute", top: "20px", right: "20px", backgroundColor: "#FA912D", color: "#10233F", fontWeight: 700, fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "9999px", padding: "4px 12px" }}>{badge}</span>}
      <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: highlight ? "#FFB55E" : "#C96C00", marginBottom: "6px" }}>{subtitle}</p>
      <h3 style={{ fontWeight: 700, fontSize: "20px", color: highlight ? "#fff" : "#10233F", marginBottom: "16px" }}>{title}</h3>
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontWeight: 800, fontSize: "38px", letterSpacing: "-0.04em", color: highlight ? "#fff" : "#10233F" }}>${monthlyPrice}</span>
        <span style={{ fontSize: "14px", color: highlight ? "rgba(255,255,255,.6)" : "rgba(16,35,63,.55)" }}>/mo{billing === "annual" ? " billed annually" : ""}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {features.map((f) => (
          <li key={f} style={{ display: "flex", gap: "8px", fontSize: "14px", color: highlight ? "rgba(255,255,255,.8)" : "rgba(16,35,63,.72)" }}>
            <span style={{ color: highlight ? "#FFB55E" : "#FA912D", flexShrink: 0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button onClick={onSelect} style={{ fontWeight: 700, fontSize: "14.5px", borderRadius: "9999px", padding: "13px", border: highlight ? "none" : selected ? "2px solid #10233F" : "1.5px solid #F4F7FD", backgroundColor: highlight ? (selected ? "rgba(255,255,255,.2)" : "#FA912D") : selected ? "#10233F" : "#F4F7FD", color: highlight ? (selected ? "#fff" : "#10233F") : selected ? "#fff" : "#10233F", cursor: "pointer", width: "100%" }}>
        {selected ? "Selected ✓" : "Choose this"}
      </button>
    </div>
  );
}
