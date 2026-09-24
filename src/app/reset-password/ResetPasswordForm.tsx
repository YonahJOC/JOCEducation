"use client";

import Link from "next/link";
import { sectionHeading, pageTitle, C } from "@/lib/joc-tokens";
import { useState, useTransition } from "react";
import { completePasswordReset } from "@/app/actions/reset";

const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", minHeight: "46px",
  fontSize: "15px", color: C.ink, backgroundColor: C.panel,
  border: `1px solid ${C.hairline}`, borderRadius: "10px",
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
        <h2 style={{ ...sectionHeading, color: C.ink, marginBottom: "10px" }}>Password changed</h2>
        <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.6, marginBottom: "24px" }}>
          You can sign in with your new password now.
        </p>
        <Link
          href="/login"
          style={{ display: "block", textAlign: "center", backgroundColor: C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", textDecoration: "none" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ ...pageTitle, color: C.ink, marginBottom: "8px" }}>
        Choose a new password
      </h1>
      <p style={{ fontSize: "15px", color: C.muted, marginBottom: "28px", lineHeight: 1.55 }}>
        For <strong style={{ color: C.ink }}>{email}</strong>. At least 10 characters.
      </p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "15px", color: C.ink, marginBottom: "6px" }}>
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
          <label style={{ display: "block", fontWeight: 600, fontSize: "15px", color: C.ink, marginBottom: "6px" }}>
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

        {error && <p style={{ fontSize: "15px", color: C.redText, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={pending || !password || !again}
          style={{
            width: "100%", fontFamily: "var(--font-outfit)",
            backgroundColor: !pending && password && again ? C.blue : "rgba(45,70,175,.4)",
            color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: "12px",
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
