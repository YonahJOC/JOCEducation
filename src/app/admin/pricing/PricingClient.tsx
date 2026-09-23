"use client";

import { useState, useTransition } from "react";
import { R, C } from "@/lib/joc-tokens";
import { PageIntro } from "@/components/admin/PageIntro";
import { savePlanPrices, saveProgramPrices, importCurrentPricing } from "@/app/actions/pricing";
import {
  ENROLLMENT_LABELS, PRICE_TIER_LABELS, ANNUAL_DISCOUNT,
  type PlanPricing, type ProgramPricing, type PriceTier, type TierPrice,
} from "@/lib/pricing";

const TIERS: PriceTier[] = ["none", "teacher", "staff", "app", "full"];

const card: React.CSSProperties = {
  backgroundColor: "#fff", border: `1px solid ${C.hairline}`,
  borderRadius: "16px", padding: "20px", marginBottom: "16px",
};
const num: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: C.ink, backgroundColor: "#fff",
  border: `1px solid ${C.hairline}`, borderRadius: "9px",
  padding: "9px 10px", minHeight: "42px", outline: "none",
};

/** One cell of the program table: a price, "included", or "not available". */
function cellValue(t: TierPrice): string {
  if (t.included) return "inc";
  if (t.na) return "na";
  return t.cents != null ? String(t.cents / 100) : "";
}
function parseCell(v: string): TierPrice {
  const s = v.trim().toLowerCase();
  if (s === "inc" || s === "included") return { included: true };
  if (s === "na" || s === "-" || s === "") return { na: true };
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? { cents: Math.round(n * 100) } : { na: true };
}

export function PricingClient({
  plans: initialPlans, programs: initialPrograms, isSet, disabled,
}: {
  plans: PlanPricing[];
  programs: ProgramPricing[];
  /** False while the page is still showing the figures written into the code. */
  isSet: boolean;
  disabled?: boolean;
}) {
  const [plans, setPlans] = useState(
    initialPlans.map((p) => ({ key: p.key, label: p.label, s: p.prices.s, m: p.prices.m, l: p.prices.l }))
  );
  const [programs, setPrograms] = useState(
    initialPrograms.map((p) => ({ label: p.label, tiers: p.prices as Record<string, TierPrice> }))
  );
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function savePlans() {
    setMsg(null);
    start(async () => {
      const r = await savePlanPrices(plans);
      setMsg(r.ok ? "Plan prices saved." : r.error);
    });
  }

  function savePrograms() {
    setMsg(null);
    start(async () => {
      const r = await saveProgramPrices(programs);
      setMsg(r.ok ? "Program prices saved." : r.error);
    });
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <PageIntro
        title="Pricing"
        what="Every figure on the public pricing page. These were written into the code, which meant a price change needed a developer."
        steps={[
          "The top table is the monthly price of each plan, by school size.",
          "Annual billing takes " + Math.round(ANNUAL_DISCOUNT * 100) + "% off automatically — do not discount it here as well.",
          "The lower table is what each program costs at each subscription level.",
          "In that table type a number for a price, “inc” if the plan includes it, or “na” if it is not offered at that level.",
          "Press Save under whichever table you changed.",
        ]}
        note="Nothing on this page is charged automatically. These are the figures a school reads before speaking to you."
      />

      {!isSet && (
        <div style={{ backgroundColor: "#FFF0E0", border: "1px solid rgba(154,84,5,.25)", borderRadius: "14px", padding: "16px 18px", marginBottom: "18px" }}>
          <p style={{ fontSize: "14px", color: "#7C4A00", margin: "0 0 10px", lineHeight: 1.55 }}>
            The pricing page is still showing figures written into the code. Nobody at JOC set them —
            they were placeholders. Bring them in here, then correct them.
          </p>
          <button
            onClick={() => start(async () => {
              const r = await importCurrentPricing();
              setMsg(r.ok ? "Imported — now correct them." : r.error);
            })}
            disabled={disabled || pending}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "15px", color: "#fff",
              backgroundColor: "#C96C00", border: "none", borderRadius: R.chip,
              padding: "10px 18px", minHeight: "42px", cursor: pending ? "wait" : "pointer",
            }}
          >
            {pending ? "Importing…" : "Bring in the current figures"}
          </button>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "15px", color: msg.includes("saved") || msg.includes("Imported") ? C.greenText : C.redText, marginBottom: "14px" }}>
          {msg}
        </p>
      )}

      {/* Plans */}
      <div style={card}>
        <p style={{ fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 4px" }}>
          Plans — price per month
        </p>
        <p style={{ fontSize: "15px", color: "#4A5A74", margin: "0 0 16px" }}>
          In whole dollars. Annual billing shows {Math.round(ANNUAL_DISCOUNT * 100)}% less, worked out for you.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
            <thead>
              <tr>
                <th style={th}>Plan</th>
                {(["s", "m", "l"] as const).map((k) => (
                  <th key={k} style={th}>{ENROLLMENT_LABELS[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((p, i) => (
                <tr key={p.key}>
                  <td style={td}>
                    <input
                      value={p.label}
                      onChange={(e) => setPlans(plans.map((x, n) => n === i ? { ...x, label: e.target.value } : x))}
                      disabled={disabled}
                      style={num}
                    />
                  </td>
                  {(["s", "m", "l"] as const).map((k) => (
                    <td key={k} style={td}>
                      <input
                        type="number" min={0}
                        value={p[k]}
                        onChange={(e) => setPlans(plans.map((x, n) => n === i ? { ...x, [k]: Number(e.target.value) } : x))}
                        disabled={disabled}
                        style={num}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={savePlans}
          disabled={disabled || pending}
          style={saveButton(disabled || pending)}
        >
          {pending ? "Saving…" : "Save plan prices"}
        </button>
      </div>

      {/* Programs */}
      <div style={card}>
        <p style={{ fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 4px" }}>
          Programs — what each one costs
        </p>
        <p style={{ fontSize: "15px", color: "#4A5A74", margin: "0 0 16px" }}>
          A number for a price, <strong style={{ color: C.ink }}>inc</strong> if that plan includes it,{" "}
          <strong style={{ color: C.ink }}>na</strong> if it is not offered at that level.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr>
                <th style={th}>Program</th>
                {TIERS.map((t) => (
                  <th key={t} style={{ ...th, fontSize: "12px" }}>{PRICE_TIER_LABELS[t]}</th>
                ))}
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {programs.map((p, i) => (
                <tr key={i}>
                  <td style={td}>
                    <input
                      value={p.label}
                      onChange={(e) => setPrograms(programs.map((x, n) => n === i ? { ...x, label: e.target.value } : x))}
                      disabled={disabled}
                      style={num}
                    />
                  </td>
                  {TIERS.map((t) => (
                    <td key={t} style={td}>
                      <input
                        value={cellValue(p.tiers[t] ?? { na: true })}
                        onChange={(e) => setPrograms(programs.map((x, n) =>
                          n === i ? { ...x, tiers: { ...x.tiers, [t]: parseCell(e.target.value) } } : x
                        ))}
                        placeholder="na"
                        disabled={disabled}
                        style={{ ...num, textAlign: "center" }}
                      />
                    </td>
                  ))}
                  <td style={td}>
                    <button
                      onClick={() => setPrograms(programs.filter((_, n) => n !== i))}
                      disabled={disabled}
                      style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.redText, background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => setPrograms([...programs, { label: "", tiers: Object.fromEntries(TIERS.map((t) => [t, { na: true }])) }])}
          disabled={disabled}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 600, color: C.blue, background: "none", border: "none", padding: "12px 0 0", minHeight: "42px", cursor: "pointer", display: "block" }}
        >
          + Add a program
        </button>

        <button
          onClick={savePrograms}
          disabled={disabled || pending}
          style={saveButton(disabled || pending)}
        >
          {pending ? "Saving…" : "Save program prices"}
        </button>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "#4A5A74", padding: "0 6px 8px", whiteSpace: "nowrap",
};
const td: React.CSSProperties = { padding: "4px 6px", verticalAlign: "middle" };

function saveButton(off: boolean): React.CSSProperties {
  return {
    marginTop: "16px", fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px",
    color: "#fff", backgroundColor: C.blue, border: "none", borderRadius: R.chip,
    padding: "11px 22px", minHeight: "44px", cursor: off ? "not-allowed" : "pointer",
    opacity: off ? 0.5 : 1,
  };
}
