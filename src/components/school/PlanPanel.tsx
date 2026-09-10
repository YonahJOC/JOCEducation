"use client";

import { useState, useTransition } from "react";
import { requestPlanChange } from "@/app/actions/school";

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE = "#FA912D";
const ORANGE_TEXT = "#C96C00";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.14)";

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
  if (!d) return "—";
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
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Plan &amp; seats
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 20px" }}>
        What {schoolName} is on, and how to change it.
      </p>

      {/* Current plan */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "22px", marginBottom: "16px" }}>
        {plan ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "18px", marginBottom: "18px" }}>
              <Stat label="Plan" value={PLAN_LABELS[plan] ?? plan} />
              <Stat label="Billing" value={interval ? interval.charAt(0) + interval.slice(1).toLowerCase() : "—"} />
              <Stat label="Seats" value={`${seatsUsed} of ${seats ?? "—"}`} />
              <Stat label="Renews" value={fmt(renewsOn)} />
            </div>

            {seats !== null && (
              <div style={{ height: "6px", borderRadius: "9999px", backgroundColor: "rgba(16,35,63,.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (seatsUsed / seats) * 100)}%`, backgroundColor: BLUE, borderRadius: "9999px" }} />
              </div>
            )}

            {grantedManually && (
              <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: GREEN, backgroundColor: "rgba(27,127,75,.08)", borderRadius: "10px", padding: "10px 13px", margin: "16px 0 0" }}>
                Just One Chesed has granted this access. There is nothing to pay.
              </p>
            )}
            {planStatus === "PAST_DUE" && (
              <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: ORANGE_TEXT, backgroundColor: "rgba(250,145,45,.12)", borderRadius: "10px", padding: "10px 13px", margin: "16px 0 0" }}>
                There is an outstanding payment. {contact} will be in touch.
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.7)", margin: 0 }}>
            No plan is set up yet. Ask {contact} below and they will get you started.
          </p>
        )}
      </div>

      {/* Request a change — explicitly a request */}
      <form
        onSubmit={submit}
        style={{ backgroundColor: "#FFFBF3", border: `1px solid ${ORANGE}`, borderRadius: "16px", padding: "22px", marginBottom: "16px" }}
      >
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: ORANGE_TEXT, margin: "0 0 12px" }}>
          Ask for a change
        </p>
        <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(16,35,63,.75)", margin: "0 0 16px" }}>
          This goes to <strong style={{ color: INK }}>{contact}</strong>. Nothing changes and nothing is
          charged until you have spoken to them.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="More seats for next term, moving up a plan, a question about cost…"
          style={{
            width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
            backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
            padding: "11px 13px", outline: "none", resize: "vertical", marginBottom: "10px",
          }}
        />

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: "13.5px", color: "rgba(16,35,63,.7)" }}>
            Seats needed (optional){" "}
            <input
              value={wantsSeats}
              onChange={(e) => setWantsSeats(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              style={{
                width: "72px", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
                backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "8px",
                padding: "8px 10px", outline: "none", marginLeft: "6px",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={pending || !message.trim()}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
              backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 22px",
              minHeight: "44px", cursor: !message.trim() ? "not-allowed" : "pointer",
              opacity: pending || !message.trim() ? 0.5 : 1,
            }}
          >
            {pending ? "Sending…" : "Send request"}
          </button>
          {msg && (
            <span style={{ fontSize: "13px", color: msg.kind === "ok" ? GREEN : "#B91C1C" }}>{msg.text}</span>
          )}
        </div>
      </form>

      {/* Past requests */}
      {requests.length > 0 && (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "20px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 16px" }}>
            Requests you have sent
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {requests.map((r) => (
              <div key={r.id} style={{ paddingBottom: "16px", borderBottom: "1px solid rgba(16,35,63,.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "5px" }}>
                  <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)" }}>{fmt(r.createdAt)}</span>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                    color: r.status === "OPEN" ? ORANGE_TEXT : GREEN,
                  }}>
                    {r.status === "OPEN" ? "Waiting for JOC" : r.status.toLowerCase()}
                  </span>
                </div>
                <p style={{ fontSize: "14px", lineHeight: 1.6, color: INK, margin: 0 }}>{r.message}</p>
                {r.response && (
                  <div style={{ marginTop: "10px", paddingLeft: "13px", borderLeft: `3px solid ${BLUE}` }}>
                    <p style={{ fontSize: "12px", color: "rgba(16,35,63,.5)", margin: "0 0 3px" }}>
                      Just One Chesed replied {fmt(r.respondedAt)}
                    </p>
                    <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(16,35,63,.8)", margin: 0 }}>{r.response}</p>
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
      <p style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 5px" }}>
        {label}
      </p>
      <p style={{ fontSize: "16px", fontWeight: 600, color: INK, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
    </div>
  );
}
