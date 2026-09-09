"use client";

import Link from "next/link";
import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", school: "", email: "", role: "teacher", subject: "general", message: "" });
  const [state, setState] = useState<FormState>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.message) return;
    setState("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("server error");
      setState("success");
    } catch {
      setState("error");
    }
  }

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  if (state === "success") {
    return (
      <div style={{ maxWidth: "560px", margin: "80px auto", padding: "0 26px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>✉</div>
        <h1 style={{ fontWeight: 800, fontSize: "28px", letterSpacing: "-0.03em", color: "#10233F", marginBottom: "12px" }}>Message received</h1>
        <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.6, marginBottom: "28px" }}>
          Thank you for reaching out. Someone from the JOC Education team will be in touch within one business day.
        </p>
        <Link href="/" style={{ backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "13px 28px", textDecoration: "none" }}>
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "60px 26px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px" }}>

      {/* Left — context */}
      <div>
        <p style={{ fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C96C00", marginBottom: "12px" }}>GET IN TOUCH</p>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.06, letterSpacing: "-0.04em", color: "#10233F", marginBottom: "18px" }}>
          Talk to the<br />JOC Education team.
        </h1>
        <p style={{ fontSize: "16px", color: "rgba(16,35,63,.65)", lineHeight: 1.65, marginBottom: "36px" }}>
          Questions about a subscription, a program, or how to bring JOC to your school? We respond to every message within one business day.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {[
            { icon: "📋", title: "Pricing & plans", description: "Which subscription is right for your school?", href: "/pricing" },
            { icon: "🎓", title: "Programs overview", description: "What programs JOC runs and how to register", href: "/programs" },
            { icon: "📚", title: "Resource library", description: "460+ worksheets, videos, and source sheets", href: "/resources" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "18px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid rgba(16,35,63,.1)", textDecoration: "none" }}
            >
              <span style={{ fontSize: "22px", flexShrink: 0 }}>{link.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "#10233F", marginBottom: "3px" }}>{link.title}</div>
                <div style={{ fontSize: "13.5px", color: "rgba(16,35,63,.55)" }}>{link.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={form.name} onChange={update("name")} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>School</label>
              <input value={form.school} onChange={update("school")} placeholder="School name" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ color: "#E03030" }}>*</span></label>
            <input type="email" value={form.email} onChange={update("email")} placeholder="your@school.edu" style={inputStyle} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Your role</label>
              <select value={form.role} onChange={update("role")} style={inputStyle}>
                <option value="teacher">Teacher</option>
                <option value="principal">Principal / Head of School</option>
                <option value="coordinator">Chesed coordinator</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={form.subject} onChange={update("subject")} style={inputStyle}>
                <option value="general">General inquiry</option>
                <option value="pricing">Pricing & plans</option>
                <option value="programs">Programs</option>
                <option value="resources">Resource library</option>
                <option value="technical">Technical support</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Message <span style={{ color: "#E03030" }}>*</span></label>
            <textarea
              value={form.message}
              onChange={update("message")}
              placeholder="Tell us about your school and what you're looking for…"
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
              required
            />
          </div>

          {state === "error" && (
            <p style={{ fontSize: "14px", color: "#C53030", backgroundColor: "#FFF5F5", borderRadius: "10px", padding: "12px 16px" }}>
              Something went wrong. Please try again or email us directly.
            </p>
          )}

          <button
            type="submit"
            disabled={state === "submitting"}
            style={{ backgroundColor: "#2D46AF", color: "#fff", fontWeight: 700, fontSize: "15px", borderRadius: "9999px", padding: "14px 28px", border: "none", cursor: state === "submitting" ? "not-allowed" : "pointer", opacity: state === "submitting" ? 0.7 : 1 }}
          >
            {state === "submitting" ? "Sending…" : "Send message"}
          </button>
          <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.45)", textAlign: "center" }}>
            We respond within one business day. No spam, ever.
          </p>
        </form>
      </div>

    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: "13px",
  color: "#10233F",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#F8FAFE",
  border: "1px solid rgba(16,35,63,.18)",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "14.5px",
  color: "#10233F",
  fontFamily: "var(--font-outfit)",
  boxSizing: "border-box",
  outline: "none",
};
