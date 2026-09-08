"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/ui/LogoMark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setError("Authentication is not yet configured. Check back soon.");
    }, 900);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: "#FBF9F4" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "36px" }}>
          <LogoMark size={40} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.025em", color: "#10233F" }}>JustOneChesed</div>
            <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#C96C00", marginTop: "2px" }}>EDUCATION</div>
          </div>
        </Link>

        <div style={{ backgroundColor: "#fff", borderRadius: "24px", border: "1px solid rgba(16,35,63,.1)", padding: "36px" }}>
          <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "6px" }}>Welcome back</h1>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", marginBottom: "28px" }}>Sign in to your JOC Education account.</p>

          {/* Google sign-in */}
          <button
            type="button"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "13px 20px", borderRadius: "12px", border: "1px solid rgba(16,35,63,.18)", backgroundColor: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "14.5px", color: "#10233F", marginBottom: "20px" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" fill="#FBBC05"/>
              <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(16,35,63,.1)" }} />
            <span style={{ fontSize: "13px", color: "rgba(16,35,63,.4)", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(16,35,63,.1)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "13.5px", color: "#10233F", marginBottom: "6px" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                autoComplete="email"
                style={inputStyle}
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontWeight: 600, fontSize: "13.5px", color: "#10233F" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "13px", color: "#1E47B8", textDecoration: "none" }}>Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ fontSize: "13.5px", color: "#B91C1C", backgroundColor: "#FEF2F2", borderRadius: "10px", padding: "10px 14px" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: "4px", width: "100%", backgroundColor: loading ? "rgba(30,71,184,.6)" : "#1E47B8", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", border: "none", cursor: loading ? "default" : "pointer" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ marginTop: "22px", textAlign: "center", fontSize: "14px", color: "rgba(16,35,63,.6)" }}>
            Don't have an account?{" "}
            <Link href="/signup" style={{ color: "#1E47B8", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  fontSize: "15px",
  color: "#10233F",
  backgroundColor: "#F8FAFE",
  border: "1px solid rgba(16,35,63,.18)",
  borderRadius: "10px",
  outline: "none",
  fontFamily: "var(--font-outfit)",
};
