"use client";

import { useState, useTransition } from "react";
import { label, R, C } from "@/lib/joc-tokens";
import { setSchoolPlan, setSchoolStatus, revokeSchoolAccess } from "@/app/actions/admin";

const PLANS = [
  ["SINGLE_TEACHER", "Single Teacher"],
  ["JOC_EDUCATION", "JOC Education"],
  ["APP_AND_EDUCATION", "App + Education"],
  ["FULL_PARTNERSHIP", "Full Partnership"],
] as const;

/** The three kinds of free access, each with what it means. */
const GRANT_KINDS: [string, string, string][] = [
  ["SCHOLARSHIP", "Scholarship", "The school cannot afford it."],
  ["PILOT", "Pilot", "Trying it with us before committing."],
  ["COMP", "Comp", "Internal, or a courtesy."],
];

const STATUSES = [
  ["PROSPECT", "Prospect"],
  ["DEMO_SCHEDULED", "Demo scheduled"],
  ["TRIAL", "Trial"],
  ["ACTIVE", "Active"],
  ["LAPSED", "Lapsed"],
  ["CHURNED", "Churned"],
] as const;

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink,
  backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};


export function PlanPanel({
  schoolId, plan, planStatus, seats, grantedManually, renewsOn, status, disabled,
  grantKind = null, grantNote = null, grantReviewOn = null, grantedBy = null,
}: {
  schoolId: string;
  plan: string | null;
  planStatus: string | null;
  seats: number | null;
  grantedManually: boolean;
  renewsOn: string | null;
  status: string;
  disabled?: boolean;
  grantKind?: string | null;
  grantNote?: string | null;
  grantReviewOn?: string | null;
  grantedBy?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [fPlan, setFPlan] = useState(plan ?? "JOC_EDUCATION");
  const [fSeats, setFSeats] = useState(seats ?? 10);
  const [fInterval, setFInterval] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [fGranted, setFGranted] = useState(grantedManually);
  const [fKind, setFKind] = useState<string>(grantKind ?? "");
  const [fNote, setFNote] = useState(grantNote ?? "");
  const [fReview, setFReview] = useState(grantReviewOn ?? "");
  const [fEnd, setFEnd] = useState(renewsOn ?? "");

  function save() {
    setMsg(null);
    start(async () => {
      const r = await setSchoolPlan({
        schoolId, plan: fPlan, seats: Number(fSeats) || 1, interval: fInterval,
        grantedManually: fGranted,
        grantKind: fGranted ? fKind : null,
        grantNote: fNote,
        grantReviewOn: fGranted ? fReview || null : null,
        currentPeriodEnd: fEnd || null,
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
    <div style={{ backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "16px", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <p style={{ ...label, color: C.muted, margin: 0 }}>
          Plan &amp; access
        </p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            disabled={disabled}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: disabled ? C.muted : C.blue, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer" }}
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
              <Row k="Billing status" v={planStatus ?? "Not recorded"} />
              <Row k="Seats" v={seats == null ? "Not set" : String(seats)} />
              <Row k="Renews" v={renewsOn ? new Date(renewsOn).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "No renewal date"} />
              {grantedManually && (
                <div style={{ backgroundColor: "rgba(27,127,75,.07)", border: "1px solid rgba(27,127,75,.25)", padding: "11px 13px", borderRadius: "10px", marginTop: "6px" }}>
                  <p style={{ ...label, color: C.greenText, margin: "0 0 5px" }}>
                    {(grantKind ?? "granted").toLowerCase()} · free access
                  </p>
                  {grantNote && (
                    <p style={{ fontSize: "13px", lineHeight: 1.5, color: C.muted, margin: "0 0 4px" }}>{grantNote}</p>
                  )}
                  <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>
                    {grantedBy ? `Approved by ${grantedBy}` : "Approver not recorded"}
                    {grantReviewOn ? ` · review ${new Date(grantReviewOn).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: C.muted, margin: "0 0 16px", lineHeight: 1.55 }}>
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
                    padding: "6px 11px", borderRadius: R.chip, minHeight: "36px",
                    border: status === v ? "1.5px solid #2D46AF" : `1px solid ${C.hairline}`,
                    backgroundColor: status === v ? C.panel : C.white,
                    color: status === v ? C.blue : C.muted,
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
              style={{ marginTop: "14px", fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.redText, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0 }}
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
          {/* Granting free access — three distinct kinds, each with a reason */}
          <div style={{ border: `1.5px solid ${fGranted ? C.greenText : C.hairline}`, borderRadius: "12px", padding: "14px", backgroundColor: fGranted ? "rgba(27,127,75,.04)" : "transparent" }}>
            <label style={{ display: "flex", gap: "9px", alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={fGranted}
                onChange={(e) => { setFGranted(e.target.checked); if (!e.target.checked) setFKind(""); }}
                style={{ marginTop: "3px", width: "16px", height: "16px" }}
              />
              <span style={{ fontSize: "15px", color: C.ink, lineHeight: 1.5, fontWeight: 600 }}>
                Give this school free access
                <small style={{ display: "block", color: C.muted, fontSize: "13px", fontWeight: 400 }}>
                  No payment. Recorded on the school&rsquo;s history with who approved it.
                </small>
              </span>
            </label>

            {fGranted && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={label}>What kind</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {GRANT_KINDS.map(([v, l, why]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFKind(v)}
                        title={why}
                        style={{
                          fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
                          padding: "8px 13px", borderRadius: R.chip, minHeight: "40px", cursor: "pointer",
                          border: fKind === v ? "1.5px solid #1D6B37" : `1px solid ${C.hairline}`,
                          backgroundColor: fKind === v ? "rgba(27,127,75,.1)" : C.white,
                          color: fKind === v ? C.greenText : C.muted,
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  {fKind && (
                    <p style={{ fontSize: "13px", color: C.muted, margin: "7px 0 0" }}>
                      {GRANT_KINDS.find(([v]) => v === fKind)?.[2]}
                    </p>
                  )}
                </div>

                <div>
                  <label style={label}>Why — required</label>
                  <textarea
                    value={fNote}
                    onChange={(e) => setFNote(e.target.value)}
                    rows={2}
                    placeholder="So this is answerable in a year's time"
                    style={{ ...field, resize: "vertical" }}
                  />
                </div>

                <div>
                  <label style={label}>Review on</label>
                  <input type="date" value={fReview} onChange={(e) => setFReview(e.target.value)} style={field} />
                  <p style={{ fontSize: "12px", color: C.muted, margin: "5px 0 0" }}>
                    JOC reviews grants each Elul.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
            <button
              onClick={save}
              disabled={pending}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: C.white, backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "11px 20px", minHeight: "42px", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setMsg(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: C.muted, background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13px", marginTop: "12px", marginBottom: 0, color: msg === "Saved." || msg.includes("updated") || msg.includes("revoked") ? C.greenText : C.redText }}>
          {msg}
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
      <span style={{ color: C.muted }}>{k}</span>
      <span style={{ color: C.ink, fontWeight: 500, textAlign: "right" }}>{v}</span>
    </div>
  );
}
