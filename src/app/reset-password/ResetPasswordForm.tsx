"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completePasswordReset } from "@/app/actions/reset";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#B8321E";

const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", minHeight: "46px",
  fontSize: "15px", color: INK, backgroundColor: "#F8FAFE",
  border: "1px solid rgba(16,35,63,.18)", borderRadius: "10px",
  outline: "none", fontFamily: "var(--font-outfit)",
};

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== again) { setError("The two passwords do not match."); return; }
    start(async () => {
      const r = await completePasswordReset({ email, token, password });
      if (r.ok) setDone(true);
      else setError(r.error);
    });
  }

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(27,127,75,.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "24px" }}>✓</div>
        <h2 style={{ fontWeight: 800, fontSize: "22px", color: INK, marginBottom: "10px" }}>Password changed</h2>
        <p style={{ fontSize: "15px", color: "rgba(16,35,63,.62)", lineHeight: 1.6, marginBottom: "24px" }}>
          You can sign in with your new password now.
        </p>
        <Link
          href="/login"
          style={{ display: "block", textAlign: "center", backgroundColor: BLUE, color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", textDecoration: "none" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, marginBottom: "8px" }}>
        Choose a new password
      </h1>
      <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", marginBottom: "28px", lineHeight: 1.55 }}>
        For <strong style={{ color: INK }}>{email}</strong>. At least 10 characters.
      </p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "13.5px", color: INK, marginBottom: "6px" }}>
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            style={input}
          />
        </div>
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "13.5px", color: INK, marginBottom: "6px" }}>
            Type it again
          </label>
          <input
            type="password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            autoComplete="new-password"
            style={input}
          />
        </div>

        {error && <p style={{ fontSize: "13.5px", color: RED, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={pending || !password || !again}
          style={{
            width: "100%", fontFamily: "var(--font-outfit)",
            backgroundColor: !pending && password && again ? BLUE : "rgba(45,70,175,.4)",
            color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px",
            padding: "14px", minHeight: "48px", border: "none",
            cursor: !pending && password && again ? "pointer" : "default",
          }}
        >
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </>
  );
}
