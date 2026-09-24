"use client";

import { useState, useTransition } from "react";
import { pageTitle, label as uiLabel, R, C } from "@/lib/joc-tokens";
import { requestPlanChange } from "@/app/actions/school";

const PLAN_LABELS: Record<string, string> = {
  SINGLE_TEACHER: "Single Teacher Use",
  JOC_EDUCATION: "JOC Education",
  APP_AND_EDUCATION: "JOC App + JOC Education",
  FULL_PARTNERSHIP: "Full JOC Partnership",
};

type Request = {
  id: string; message: string; status: string;
  response: string | null; createdAt: Date | string; respondedAt: Date | string | null;
};

function fmt(d: Date | string | null) {
  if (!d) return "Not set";
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function SchoolPlanPanel({
  schoolName, plan, planStatus, interval, seats, seatsUsed, renewsOn,
  grantedManually, accountManager, requests,
}: {
  schoolName: string;
  plan: string | null;
  planStatus: string | null;
  interval: string | null;
  seats: number | null;
  seatsUsed: number;
  renewsOn: Date | string | null;
  grantedManually: boolean;
  accountManager: string | null;
  requests: Request[];
}) {
  const [message, setMessage] = useState("");
  const [wantsSeats, setWantsSeats] = useState<string>("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const contact = accountManager ?? "the Just One Chesed team";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await requestPlanChange({
        message,
        wantsSeats: wantsSeats ? Number(wantsSeats) : undefined,
      });
      if (r.ok) { setMessage(""); setWantsSeats(""); setMsg({ kind: "ok", text: "Sent. Nothing has changed yet." }); }
      else setMsg({ kind: "err", text: r.error });
    });
  }

  return (
    <div>
      <h1 style={{ ...pageTitle, color: C.ink, margin: "0 0 4px" }}>
        Plan &amp; seats
      </h1>
      <p style={{ fontSize: "14px", color: C.muted, margin: "0 0 20px" }}>
        What {schoolName} is on, and how to change it.
      </p>

      {/* Current plan */}
      <div style={{ backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "16px", padding: "22px", marginBottom: "16px" }}>
        {plan ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "18px", marginBottom: "18px" }}>
              <Stat label="Plan" value={PLAN_LABELS[plan] ?? plan} />
              <Stat label="Billing" value={interval ? interval.charAt(0) + interval.slice(1).toLowerCase() : "Not set"} />
              <Stat label="Seats" value={seats == null ? `${seatsUsed} used, no seat limit set` : `${seatsUsed} of ${seats}`} />
              <Stat label="Renews" value={fmt(renewsOn)} />
            </div>

            {seats !== null && (
              <div style={{ height: "6px", borderRadius: R.chip, backgroundColor: C.panel, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (seatsUsed / seats) * 100)}%`, backgroundColor: C.blue, borderRadius: R.chip }} />
              </div>
            )}

            {grantedManually && (
              <p style={{ fontSize: "15px", lineHeight: 1.55, color: C.greenText, backgroundColor: "rgba(27,127,75,.08)", borderRadius: "10px", padding: "10px 13px", margin: "16px 0 0" }}>
                Just One Chesed has granted this access. There is nothing to pay.
              </p>
            )}
            {planStatus === "PAST_DUE" && (
              <p style={{ fontSize: "15px", lineHeight: 1.55, color: C.orangeText, backgroundColor: "rgba(250,145,45,.12)", borderRadius: "10px", padding: "10px 13px", margin: "16px 0 0" }}>
                There is an outstanding payment. {contact} will be in touch.
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: C.muted, margin: 0 }}>
            No plan is set up yet. Ask {contact} below and they will get you started.
          </p>
        )}
      </div>

      {/* Request a change — explicitly a request */}
      <form
        onSubmit={submit}
        style={{ backgroundColor: C.paper, border: `1px solid ${C.orange}`, borderRadius: "16px", padding: "22px", marginBottom: "16px" }}
      >
        <p style={{ ...uiLabel, color: C.orangeText, margin: "0 0 12px" }}>
          Ask for a change
        </p>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: C.muted, margin: "0 0 16px" }}>
          This goes to <strong style={{ color: C.ink }}>{contact}</strong>. Nothing changes and nothing is
          charged until you have spoken to them.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="More seats for next term, moving up a plan, a question about cost…"
          style={{
            width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink,
            backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "10px",
            padding: "11px 13px", outline: "none", resize: "vertical", marginBottom: "10px",
          }}
        />

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: "15px", color: C.muted }}>
            Seats needed (optional){" "}
            <input
              value={wantsSeats}
              onChange={(e) => setWantsSeats(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              style={{
                width: "72px", fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink,
                backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px",
                padding: "8px 10px", outline: "none", marginLeft: "6px",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={pending || !message.trim()}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: C.white,
              backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "12px 22px",
              minHeight: "44px", cursor: !message.trim() ? "not-allowed" : "pointer",
              opacity: pending || !message.trim() ? 0.5 : 1,
            }}
          >
            {pending ? "Sending…" : "Send request"}
          </button>
          {msg && (
            <span style={{ fontSize: "13px", color: msg.kind === "ok" ? C.greenText : C.redText }}>{msg.text}</span>
          )}
        </div>
      </form>

      {/* Past requests */}
      {requests.length > 0 && (
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: "16px", padding: "20px" }}>
          <p style={{ ...uiLabel, color: C.muted, margin: "0 0 16px" }}>
            Requests you have sent
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {requests.map((r) => (
              <div key={r.id} style={{ paddingBottom: "16px", borderBottom: `1px solid ${C.hairline}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", color: C.muted }}>{fmt(r.createdAt)}</span>
                  <span style={{
                    ...uiLabel,
                    color: r.status === "OPEN" ? C.orangeText : C.greenText,
                  }}>
                    {r.status === "OPEN" ? "Waiting for JOC" : r.status.toLowerCase()}
                  </span>
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.6, color: C.ink, margin: 0 }}>{r.message}</p>
                {r.response && (
                  <div style={{ marginTop: "10px", paddingLeft: "13px", borderLeft: `3px solid ${C.blue}` }}>
                    <p style={{ fontSize: "12px", color: C.muted, margin: "0 0 3px" }}>
                      Just One Chesed replied {fmt(r.respondedAt)}
                    </p>
                    <p style={{ fontSize: "14px", lineHeight: 1.6, color: C.ink, margin: 0 }}>{r.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ ...uiLabel, color: C.muted, margin: "0 0 5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "16px", fontWeight: 600, color: C.ink, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
    </div>
  );
}
