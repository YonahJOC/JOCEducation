"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createAccount } from "@/app/actions/signup";
import { LogoMark } from "@/components/ui/LogoMark";

const ROLES = [
  { value: "teacher", label: "Classroom teacher" },
  { value: "coordinator", label: "Chesed coordinator" },
  { value: "admin", label: "Administrator / principal" },
];

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", school: "", role: "teacher", email: "", password: "" });
  const [loading, start] = useTransition();
  const [done, setDone] = useState<{ schoolName: string | null } | null>(null);
  const [error, setError] = useState("");

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password || !form.school) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    start(async () => {
      const r = await createAccount({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        schoolName: form.school,
        role: form.role,
      });
      if (r.ok) setDone({ schoolName: r.schoolName });
      else setError(r.error);
    });
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: "#FBF9F4" }}>
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>✓</div>
          <h2 style={{ fontWeight: 800, fontSize: "26px", color: "#10233F", marginBottom: "10px" }}>Your account is ready</h2>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", lineHeight: 1.6, marginBottom: "28px" }}>
            {done.schoolName
              ? `You have been matched to ${done.schoolName}. Sign in and everything your school has access to is there.`
              : "Sign in with the address and password you just chose. If your school has a JOC account, use your school email address to be matched to it."}
          </p>
          <Link href="/login" style={{ display: "inline-block", backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: "#FBF9F4" }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "32px" }}>
          <LogoMark size={40} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.025em", color: "#10233F" }}>JustOneChesed</div>
            <div style={{ fontWeight: 700, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#C96C00", marginTop: "2px" }}>EDUCATION</div>
          </div>
        </Link>

        <div style={{ backgroundColor: "#fff", borderRadius: "24px", border: "1px solid rgba(16,35,63,.1)", padding: "36px" }}>
          <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "6px" }}>Create your account</h1>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", marginBottom: "28px" }}>Get access to all JOC Education resources.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>First name <Required /></label>
                <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Miriam" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last name</label>
                <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Cohen" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>School <Required /></label>
              <input value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="Your school's name" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Your role</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)} style={inputStyle}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Email <Required /></label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@school.edu" autoComplete="email" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password <Required /></label>
              <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 10 characters" autoComplete="new-password" style={inputStyle} />
            </div>

            {error && <p style={{ fontSize: "13.5px", color: "#B91C1C", backgroundColor: "#FEF2F2", borderRadius: "10px", padding: "10px 14px" }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: "4px", width: "100%", backgroundColor: loading ? "rgba(45,70,175,.6)" : "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", border: "none", cursor: loading ? "default" : "pointer" }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p style={{ marginTop: "22px", textAlign: "center", fontSize: "14px", color: "rgba(16,35,63,.6)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#2D46AF", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Required() { return <span style={{ color: "#C96C00", marginLeft: "2px" }}>*</span>; }

const labelStyle: React.CSSProperties = { display: "block", fontWeight: 600, fontSize: "13.5px", color: "#10233F", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "15px", color: "#10233F", backgroundColor: "#F8FAFE", border: "1px solid rgba(16,35,63,.18)", borderRadius: "10px", outline: "none", fontFamily: "var(--font-outfit)" };
