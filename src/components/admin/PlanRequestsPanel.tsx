"use client";

import { useState, useTransition } from "react";
import { label, R, C } from "@/lib/joc-tokens";
import { respondToPlanRequest } from "@/app/actions/admin";

export type PlanRequestRow = {
  id: string;
  message: string;
  status: string;
  response: string | null;
  createdAt: Date | string;
  from: string;
};

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The school has asked for something. This is where JOC answers — without it
 * the request goes nowhere and the school is left waiting.
 */
export function PlanRequestsPanel({
  requests, disabled,
}: {
  requests: PlanRequestRow[];
  disabled?: boolean;
}) {
  const open = requests.filter((r) => r.status === "OPEN");
  if (requests.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: open.length > 0 ? "1.5px solid #FA912D" : `1px solid ${C.hairline}`,
        borderRadius: "16px", padding: "20px",
      }}
    >
      <p style={{ ...label, color: open.length > 0 ? C.orangeText : "#4A5A74", margin: "0 0 14px" }}>
        {open.length > 0 ? `${open.length} request${open.length === 1 ? "" : "s"} waiting` : "Plan requests"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {requests.map((r) => <RequestRow key={r.id} request={r} disabled={disabled} />)}
      </div>
    </div>
  );
}

function RequestRow({ request, disabled }: { request: PlanRequestRow; disabled?: boolean }) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"ANSWERED" | "ACTIONED" | "DECLINED">("ANSWERED");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(request.status !== "OPEN");
  const [saved, setSaved] = useState(request.response);

  function send() {
    setErr(null);
    start(async () => {
      const r = await respondToPlanRequest({ requestId: request.id, response: text, status });
      if (r.ok) { setDone(true); setSaved(text); setReplying(false); }
      else setErr(r.error);
    });
  }

  return (
    <div style={{ paddingBottom: "16px", borderBottom: `1px solid ${C.hairline}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "5px" }}>
        <span style={{ fontSize: "13px", color: "#4A5A74" }}>
          {request.from} · {fmt(request.createdAt)}
        </span>
        <span style={{
          ...label,
          color: done ? C.greenText : C.orangeText,
        }}>
          {done ? "Answered" : "Waiting"}
        </span>
      </div>

      <p style={{ fontSize: "15px", lineHeight: 1.6, color: C.ink, margin: "0 0 10px" }}>{request.message}</p>

      {saved && (
        <div style={{ paddingLeft: "13px", borderLeft: `3px solid ${C.blue}`, marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", color: "#4A5A74", margin: "0 0 3px" }}>Your reply</p>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: C.ink, margin: 0 }}>{saved}</p>
        </div>
      )}

      {!done && !replying && (
        <button
          onClick={() => setReplying(true)}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13px", color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "9px 18px",
            minHeight: "40px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          Reply
        </button>
      )}

      {replying && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="What you can do for them, and what happens next"
            autoFocus
            style={{
              width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink,
              backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "10px",
              padding: "11px 13px", outline: "none", resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {([["ANSWERED", "Replied"], ["ACTIONED", "Done — plan changed"], ["DECLINED", "Not this time"]] as const).map(
              ([v, l]) => (
                <button
                  key={v}
                  onClick={() => setStatus(v)}
                  style={{
                    fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
                    padding: "7px 13px", borderRadius: R.chip, minHeight: "38px", cursor: "pointer",
                    border: status === v ? `1.5px solid ${C.blue}` : `1px solid ${C.hairline}`,
                    backgroundColor: status === v ? "#F4F7FD" : "#fff",
                    color: status === v ? C.blue : "#4A5A74",
                  }}
                >
                  {l}
                </button>
              )
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={send}
              disabled={pending || !text.trim()}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "15px", color: "#fff",
                backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "10px 20px",
                minHeight: "42px", cursor: text.trim() ? "pointer" : "not-allowed",
                opacity: pending || !text.trim() ? 0.5 : 1,
              }}
            >
              {pending ? "Sending…" : "Send reply"}
            </button>
            <button
              onClick={() => { setReplying(false); setErr(null); }}
              style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "15px", color: "#4A5A74", background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
            >
              Cancel
            </button>
            {err && <span style={{ fontSize: "13px", color: "#A3261A" }}>{err}</span>}
          </div>
          <p style={{ fontSize: "12px", color: "#4A5A74", margin: 0, lineHeight: 1.5 }}>
            They see this on their Plan &amp; seats page. Changing the plan itself is separate — do that above.
          </p>
        </div>
      )}
    </div>
  );
}
