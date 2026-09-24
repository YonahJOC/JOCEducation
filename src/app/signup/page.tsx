"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createAccount } from "@/app/actions/signup";
import { BrandLockup } from "@/components/ui/Brand";
import { sectionHeading, pageTitle, C, R } from "@/lib/joc-tokens";

const ROLES = [
  { value: "teacher", label: "Classroom teacher" },
  { value: "coordinator", label: "Chesed coordinator" },
  { value: "admin", label: "Administrator / principal" },
];

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", school: "", role: "teacher", email: "", password: "" });
  const [loading, start] = useTransition();
  const [done, setDone] = useState<{ verificationSent: boolean; willGetAccess: boolean } | null>(null);
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
      if (r.ok) setDone({ verificationSent: r.verificationSent, willGetAccess: r.willGetAccess });
      else setError(r.error);
    });
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: C.paper }}>
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>✓</div>
          <h2 style={{ ...sectionHeading, color: C.ink, marginBottom: "10px" }}>Your account is ready</h2>
          <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.6, marginBottom: "28px" }}>
            {done.verificationSent
              ? "Check your inbox and confirm your address. Until you do, the account exists but has no access to anything — confirming it is what connects you to your school."
              : done.willGetAccess
              ? "Your account is made. It has no access yet: that address should entitle you to more, but JOC cannot send the confirmation email until its mail service is switched on. Write to education@justonechesed.org and someone will open it up."
              : "Your account is made. It has no access to the library yet — ask Just One Chesed to connect you to your school."}
          </p>
          <Link href="/login" style={{ display: "inline-block", backgroundColor: C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: R.chip, padding: "14px 28px", textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", backgroundColor: C.paper }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none", marginBottom: "32px" }}>
          <BrandLockup height={20} />
        </Link>

        <div style={{ backgroundColor: C.white, borderRadius: "24px", border: `1px solid ${C.hairline}`, padding: "36px" }}>
          <h1 style={{ ...pageTitle, color: C.ink, marginBottom: "6px" }}>Create your account</h1>
          <p style={{ fontSize: "15px", color: C.muted, marginBottom: "28px" }}>Get access to all JOC Education resources.</p>

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

            {error && <p style={{ fontSize: "15px", color: C.redText, backgroundColor: C.redTint, borderRadius: "10px", padding: "10px 14px" }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: "4px", width: "100%", backgroundColor: loading ? "rgba(45,70,175,.6)" : C.blue, color: C.white, fontWeight: 700, fontSize: "15px", borderRadius: "12px", padding: "14px", border: "none", cursor: loading ? "default" : "pointer" }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p style={{ marginTop: "22px", textAlign: "center", fontSize: "14px", color: C.muted }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Required() { return <span style={{ color: C.orangeText, marginLeft: "2px" }}>*</span>; }

const labelStyle: React.CSSProperties = { display: "block", fontWeight: 600, fontSize: "15px", color: C.ink, marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "15px", color: C.ink, backgroundColor: C.panel, border: `1px solid ${C.hairline}`, borderRadius: "10px", outline: "none", fontFamily: "var(--font-outfit)" };
