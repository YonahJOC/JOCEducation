"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/ui/LogoMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 900);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: "#FBF9F4" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "36px" }}>
          <LogoMark size={40} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.025em", color: "#10233F" }}>JustOneChesed</div>
            <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#C96C00", marginTop: "2px" }}>EDUCATION</div>
          </div>
        </Link>

        <div style={{ backgroundColor: "#fff", borderRadius: "24px", border: "1px solid rgba(16,35,63,.1)", padding: "36px" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "24px" }}>✉</div>
              <h2 style={{ fontWeight: 800, fontSize: "22px", color: "#10233F", marginBottom: "10px" }}>Check your inbox</h2>
              <p style={{ fontSize: "15px", color: "rgba(16,35,63,.62)", lineHeight: 1.6, marginBottom: "24px" }}>
                We sent a reset link to <strong>{email}</strong>. It expires in 30 minutes.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                style={{ fontSize: "14px", color: "#1E47B8", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Didn't get it? Resend
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "8px" }}>Reset your password</h1>
              <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", marginBottom: "28px", lineHeight: 1.55 }}>
                Enter the email you signed up with and we'll send a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "13.5px", color: "#10233F", marginBottom: "6px" }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    autoComplete="email"
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "15px", color: "#10233F", backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.18)", borderRadius: "10px", outline: "none", fontFamily: "var(--font-outfit)" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{ width: "100%", backgroundColor: (!loading && email) ? "#1E47B8" : "rgba(30,71,184,.4)", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", border: "none", cursor: (!loading && email) ? "pointer" : "default" }}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "rgba(16,35,63,.55)" }}>
            <Link href="/login" style={{ color: "#1E47B8", fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
