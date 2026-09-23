"use client";

import { useState, useTransition } from "react";
import { submitForm } from "@/app/actions/forms";
import type { PublicForm } from "@/lib/forms";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#A3261A";
const RULE = "rgba(16,35,63,.16)";

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "15px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "11px",
  padding: "12px 14px", minHeight: "46px", outline: "none",
};

export function FormFill({ form, paid }: { form: PublicForm; paid: boolean }) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(paid ? form.thankYou : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = (id: string, v: string | string[]) => setValues((p) => ({ ...p, [id]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await submitForm({ slug: form.slug, name, email, values });
      if (!r.ok) { setError(r.error); return; }
      // A paid form hands back somewhere to pay rather than a thank you.
      if ("payUrl" in r) { window.location.href = r.payUrl; return; }
      setDone(r.thankYou);
    });
  }

  if (done) {
    return (
      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "18px", padding: "34px 28px", maxWidth: "58ch" }}>
        <p style={{ fontSize: "28px", margin: "0 0 10px" }}>✓</p>
        <h2 style={{ fontWeight: 800, fontSize: "21px", letterSpacing: "-0.03em", color: INK, margin: "0 0 8px" }}>
          {paid ? "Paid, and received" : "Sent"}
        </h2>
        <p style={{ fontSize: "15.5px", lineHeight: 1.6, color: "#4A5A74", margin: 0 }}>{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: "58ch" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Always asked, whatever the form is about: without a way to reply,
            an answer is a message into a void. */}
        <Labelled label="Your name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={pending} style={field} required />
        </Labelled>
        <Labelled label="Your email" required help="So we can reply.">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} style={field} required />
        </Labelled>

        {form.fields.map((f) => (
          <Labelled key={f.id} label={f.label} required={f.required} help={f.help}>
            {f.type === "LONG_TEXT" ? (
              <textarea
                rows={4}
                value={(values[f.id] as string) ?? ""}
                onChange={(e) => set(f.id, e.target.value)}
                disabled={pending}
                style={{ ...field, resize: "vertical" }}
              />
            ) : f.type === "CHOICE" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {f.options.map((o) => (
                  <label key={o} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "15px", color: INK, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={f.id}
                      checked={values[f.id] === o}
                      onChange={() => set(f.id, o)}
                      disabled={pending}
                      style={{ width: "17px", height: "17px" }}
                    />
                    {o}
                  </label>
                ))}
              </div>
            ) : f.type === "CHECKBOXES" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {f.options.map((o) => {
                  const picked = (values[f.id] as string[]) ?? [];
                  return (
                    <label key={o} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "15px", color: INK, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={picked.includes(o)}
                        onChange={() =>
                          set(f.id, picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o])
                        }
                        disabled={pending}
                        style={{ width: "17px", height: "17px" }}
                      />
                      {o}
                    </label>
                  );
                })}
              </div>
            ) : f.type === "YES_NO" ? (
              <div style={{ display: "flex", gap: "10px" }}>
                {["Yes", "No"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => set(f.id, o)}
                    disabled={pending}
                    style={{
                      fontFamily: "var(--font-outfit)", fontSize: "14.5px", fontWeight: 600,
                      padding: "11px 24px", borderRadius: "9999px", minHeight: "46px", cursor: "pointer",
                      border: values[f.id] === o ? `1.5px solid ${BLUE}` : `1px solid ${RULE}`,
                      backgroundColor: values[f.id] === o ? "rgba(45,70,175,.07)" : "#fff",
                      color: values[f.id] === o ? BLUE : "#4A5A74",
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={f.type === "EMAIL" ? "email" : f.type === "PHONE" ? "tel" : f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"}
                value={(values[f.id] as string) ?? ""}
                onChange={(e) => set(f.id, e.target.value)}
                disabled={pending}
                style={field}
              />
            )}
          </Labelled>
        ))}
      </div>

      <div style={{ marginTop: "26px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "15px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px",
            padding: "14px 28px", minHeight: "48px", cursor: pending ? "wait" : "pointer",
          }}
        >
          {pending ? "Sending…" : form.feeCents ? "Continue to payment" : "Send"}
        </button>
        {error && (
          <p style={{ fontSize: "14px", color: RED, margin: 0, lineHeight: 1.5, maxWidth: "40ch" }}>{error}</p>
        )}
      </div>
    </form>
  );
}

function Labelled({
  label, required, help, children,
}: {
  label: string;
  required?: boolean;
  help?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "14.5px", fontWeight: 600, color: INK, marginBottom: "6px" }}>
        {label}
        {required && <span style={{ color: "#C96C00", marginLeft: "5px" }} aria-label="required">*</span>}
      </label>
      {help && (
        <p style={{ fontSize: "13.5px", color: "#4A5A74", margin: "0 0 7px", lineHeight: 1.5 }}>{help}</p>
      )}
      {children}
    </div>
  );
}
