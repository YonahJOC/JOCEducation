"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/actions/reset";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#B8321E";

type State = "form" | "sent" | "no-email";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("form");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    start(async () => {
      const r = await requestPasswordReset(email);
      if (!r.ok) { setError(r.error); return; }
      setState(r.sent ? "sent" : "no-email");
    });
  }

  if (state === "sent") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "24px" }}>✉</div>
        <h2 style={{ fontWeight: 800, fontSize: "22px", color: INK, marginBottom: "10px" }}>Check your inbox</h2>
        <p style={{ fontSize: "15px", color: "rgba(16,35,63,.62)", lineHeight: 1.6, marginBottom: "24px" }}>
          If <strong>{email}</strong> has an account, a reset link is on its way. It expires in 30 minutes.
        </p>
        <button
          onClick={() => { setState("form"); setEmail(""); }}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", color: BLUE, background: "none", border: "none", cursor: "pointer", fontWeight: 600, minHeight: "44px" }}
        >
          Try a different address
        </button>
      </div>
    );
  }

  // Nothing was sent, and saying otherwise would leave someone waiting.
  if (state === "no-email") {
    return (
      <div>
        <h2 style={{ fontWeight: 800, fontSize: "21px", color: INK, marginBottom: "10px" }}>
          We can&rsquo;t email you yet
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(16,35,63,.7)", lineHeight: 1.6, marginBottom: "16px" }}>
          JOC Education has not switched on its mail service, so no reset link was sent — and
          telling you to check your inbox would just leave you waiting.
        </p>
        <p style={{ fontSize: "15px", color: "rgba(16,35,63,.7)", lineHeight: 1.6, marginBottom: "22px" }}>
          Write to{" "}
          <a href="mailto:education@justonechesed.org" style={{ color: BLUE, fontWeight: 600 }}>
            education@justonechesed.org
          </a>{" "}
          and someone will reset it for you by hand, usually the same day.
        </p>
        <Link
          href="/login"
          style={{ display: "block", textAlign: "center", backgroundColor: BLUE, color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", textDecoration: "none" }}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, marginBottom: "8px" }}>
        Reset your password
      </h1>
      <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", marginBottom: "28px", lineHeight: 1.55 }}>
        Enter the email you sign in with and we&rsquo;ll send a reset link.
      </p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, fontSize: "13.5px", color: INK, marginBottom: "6px" }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            autoComplete="email"
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", minHeight: "46px", fontSize: "15px", color: INK, backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.18)", borderRadius: "10px", outline: "none", fontFamily: "var(--font-outfit)" }}
          />
        </div>

        {error && <p style={{ fontSize: "13.5px", color: RED, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={pending || !email}
          style={{
            width: "100%", fontFamily: "var(--font-outfit)",
            backgroundColor: !pending && email ? BLUE : "rgba(45,70,175,.4)",
            color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px",
            padding: "14px", minHeight: "48px", border: "none",
            cursor: !pending && email ? "pointer" : "default",
          }}
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </>
  );
}
