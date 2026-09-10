"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeOwnPassword } from "@/app/actions/account";
import { passwordProblem } from "@/lib/password";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.15)";

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "15px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "12px",
  padding: "12px 14px", outline: "none", minHeight: "46px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12.5px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "6px",
};

export function PasswordForm({ hasPassword, forced }: { hasPassword: boolean; forced: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  // Live feedback rather than only telling them on submit.
  const strength = next ? passwordProblem(next) : null;
  const mismatch = confirm.length > 0 && next !== confirm;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await changeOwnPassword({ current, next, confirm });
      if (r.ok) {
        setDone(true);
        setCurrent(""); setNext(""); setConfirm("");
        router.refresh();
      } else {
        setErr(r.error);
      }
    });
  }

  if (done) {
    return (
      <div style={{ backgroundColor: "#fff", border: `1.5px solid ${GREEN}`, borderRadius: "18px", padding: "26px" }}>
        <p style={{ fontWeight: 700, fontSize: "19px", color: INK, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Password changed
        </p>
        <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(16,35,63,.72)", margin: "0 0 18px" }}>
          Use the new one next time you sign in.
        </p>
        <a
          href="/home"
          style={{
            display: "inline-block", backgroundColor: BLUE, color: "#fff", fontWeight: 700,
            fontSize: "14.5px", borderRadius: "9999px", padding: "13px 24px", textDecoration: "none",
          }}
        >
          Continue
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "18px", padding: "26px" }}>
      {hasPassword && (
        <div style={{ marginBottom: "16px" }}>
          <label style={label} htmlFor="current">Current password</label>
          <input
            id="current" type="password" autoComplete="current-password"
            value={current} onChange={(e) => setCurrent(e.target.value)}
            style={field} autoFocus={!forced}
          />
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label style={label} htmlFor="next">New password</label>
        <input
          id="next" type="password" autoComplete="new-password"
          value={next} onChange={(e) => setNext(e.target.value)}
          style={{ ...field, borderColor: next && strength ? "#C96C00" : RULE }}
          autoFocus={forced}
        />
        <p style={{ fontSize: "12.5px", lineHeight: 1.5, margin: "6px 0 0", color: next ? (strength ? "#C96C00" : GREEN) : "rgba(16,35,63,.55)" }}>
          {next ? (strength ?? "That will do.") : "At least 10 characters. Avoid anything with the organisation's name in it."}
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={label} htmlFor="confirm">New password again</label>
        <input
          id="confirm" type="password" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          style={{ ...field, borderColor: mismatch ? "#C96C00" : RULE }}
        />
        {mismatch && (
          <p style={{ fontSize: "12.5px", color: "#C96C00", margin: "6px 0 0" }}>These do not match yet.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !next || Boolean(strength) || mismatch || (hasPassword && !current)}
        style={{
          width: "100%", fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "15px",
          color: "#fff", backgroundColor: BLUE, border: "none", borderRadius: "9999px",
          padding: "14px 22px", minHeight: "48px",
          cursor: pending ? "default" : "pointer",
          opacity: pending || !next || Boolean(strength) || mismatch || (hasPassword && !current) ? 0.5 : 1,
        }}
      >
        {pending ? "Changing…" : "Change password"}
      </button>

      {err && (
        <p role="alert" style={{ fontSize: "13.5px", lineHeight: 1.5, color: "#B8321E", backgroundColor: "rgba(184,50,30,.07)", borderRadius: "12px", padding: "11px 14px", margin: "14px 0 0" }}>
          {err}
        </p>
      )}
    </form>
  );
}
