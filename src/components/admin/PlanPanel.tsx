"use client";

import { useState, useTransition } from "react";
import { setSchoolPlan, setSchoolStatus, revokeSchoolAccess } from "@/app/actions/admin";

const INK = "#10233F";
const RULE = "rgba(16,35,63,.15)";

const PLANS = [
  ["SINGLE_TEACHER", "Single Teacher"],
  ["JOC_EDUCATION", "JOC Education"],
  ["APP_AND_EDUCATION", "App + Education"],
  ["FULL_PARTNERSHIP", "Full Partnership"],
] as const;

const STATUSES = [
  ["PROSPECT", "Prospect"],
  ["DEMO_SCHEDULED", "Demo scheduled"],
  ["TRIAL", "Trial"],
  ["ACTIVE", "Active"],
  ["LAPSED", "Lapsed"],
  ["CHURNED", "Churned"],
] as const;

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};

const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

export function PlanPanel({
  schoolId, plan, planStatus, seats, grantedManually, renewsOn, status, disabled,
}: {
  schoolId: string;
  plan: string | null;
  planStatus: string | null;
  seats: number | null;
  grantedManually: boolean;
  renewsOn: string | null;
  status: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [fPlan, setFPlan] = useState(plan ?? "JOC_EDUCATION");
  const [fSeats, setFSeats] = useState(seats ?? 10);
  const [fInterval, setFInterval] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [fGranted, setFGranted] = useState(grantedManually);
  const [fNote, setFNote] = useState("");
  const [fEnd, setFEnd] = useState(renewsOn ?? "");

  function save() {
    setMsg(null);
    start(async () => {
      const r = await setSchoolPlan({
        schoolId, plan: fPlan, seats: Number(fSeats) || 1, interval: fInterval,
        grantedManually: fGranted, grantNote: fNote, currentPeriodEnd: fEnd || null,
      });
      setMsg(r.ok ? "Saved." : r.error);
      if (r.ok) setEditing(false);
    });
  }

  function changeStatus(next: string) {
    setMsg(null);
    start(async () => {
      const r = await setSchoolStatus(schoolId, next);
      setMsg(r.ok ? "Status updated." : r.error);
    });
  }

  function revoke() {
    const reason = window.prompt("Why is access being revoked? This is logged on the school's history.");
    if (reason === null) return;
    start(async () => {
      const r = await revokeSchoolAccess(schoolId, reason);
      setMsg(r.ok ? "Access revoked." : r.error);
    });
  }

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0 }}>
          Plan &amp; access
        </p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            disabled={disabled}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: disabled ? "rgba(16,35,63,.3)" : "#2D46AF", background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer" }}
          >
            {plan ? "Change" : "Grant access"}
          </button>
        )}
      </div>

      {!editing ? (
        <>
          {plan ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "16px" }}>
              <Row k="Plan" v={PLANS.find((p) => p[0] === plan)?.[1] ?? plan} />
              <Row k="Billing status" v={planStatus ?? "—"} />
              <Row k="Seats" v={String(seats ?? "—")} />
              <Row k="Renews" v={renewsOn ? new Date(renewsOn).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
              {grantedManually && (
                <p style={{ fontSize: "12.5px", color: "#1B7F4B", backgroundColor: "rgba(27,127,75,.08)", padding: "7px 10px", borderRadius: "8px", margin: "4px 0 0" }}>
                  Access granted manually — not billed through Stripe.
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)", margin: "0 0 16px", lineHeight: 1.55 }}>
              No plan yet. This school has no access to gated content.
            </p>
          )}

          <div>
            <p style={{ ...label, marginBottom: "7px" }}>Account status</p>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {STATUSES.map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => changeStatus(v)}
                  disabled={disabled || pending || status === v}
                  style={{
                    fontFamily: "var(--font-outfit)", fontSize: "12px", fontWeight: 600,
                    padding: "6px 11px", borderRadius: "9999px", minHeight: "36px",
                    border: status === v ? "1.5px solid #2D46AF" : `1px solid ${RULE}`,
                    backgroundColor: status === v ? "#F4F7FD" : "#fff",
                    color: status === v ? "#2D46AF" : "rgba(16,35,63,.7)",
                    cursor: disabled || status === v ? "default" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {plan && (
            <button
              onClick={revoke}
              disabled={disabled || pending}
              style={{ marginTop: "14px", fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600, color: "#B8321E", background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0 }}
            >
              Revoke access
            </button>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={label}>Plan</label>
            <select value={fPlan} onChange={(e) => setFPlan(e.target.value)} style={field}>
              {PLANS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={label}>Seats</label>
              <input type="number" min={1} value={fSeats} onChange={(e) => setFSeats(Number(e.target.value))} style={field} />
            </div>
            <div>
              <label style={label}>Billing</label>
              <select value={fInterval} onChange={(e) => setFInterval(e.target.value as "MONTHLY" | "ANNUAL")} style={field}>
                <option value="ANNUAL">Annual</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>
          <div>
            <label style={label}>Renews on</label>
            <input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} style={field} />
          </div>
          <label style={{ display: "flex", gap: "9px", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={fGranted} onChange={(e) => setFGranted(e.target.checked)} style={{ marginTop: "3px", width: "16px", height: "16px" }} />
            <span style={{ fontSize: "13.5px", color: INK, lineHeight: 1.5 }}>
              Granted manually
              <small style={{ display: "block", color: "rgba(16,35,63,.55)", fontSize: "12.5px" }}>
                Scholarship, pilot or comped — access without a Stripe subscription.
              </small>
            </span>
          </label>
          {fGranted && (
            <div>
              <label style={label}>Why</label>
              <textarea value={fNote} onChange={(e) => setFNote(e.target.value)} rows={2} placeholder="Recorded on the school's history" style={{ ...field, resize: "vertical" }} />
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
            <button
              onClick={save}
              disabled={pending}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff", backgroundColor: "#2D46AF", border: "none", borderRadius: "9999px", padding: "11px 20px", minHeight: "42px", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setMsg(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13px", marginTop: "12px", marginBottom: 0, color: msg === "Saved." || msg.includes("updated") || msg.includes("revoked") ? "#1B7F4B" : "#B8321E" }}>
          {msg}
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
      <span style={{ color: "rgba(16,35,63,.55)" }}>{k}</span>
      <span style={{ color: INK, fontWeight: 500, textAlign: "right" }}>{v}</span>
    </div>
  );
}
