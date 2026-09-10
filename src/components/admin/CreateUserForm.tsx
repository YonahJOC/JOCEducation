"use client";

import { useState, useTransition } from "react";
import { createUserAccount } from "@/app/actions/admin";
import { ASSIGNABLE_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/access";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1B7F4B";
const RULE = "rgba(16,35,63,.15)";

const field: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
  backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "44px",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(16,35,63,.6)", marginBottom: "5px",
};

/**
 * Create an account and hand over the password.
 *
 * Until Google sign-in exists this is the only way anyone gets in. The
 * password is shown exactly once, because it is stored hashed and cannot be
 * read back.
 */
export function CreateUserForm({
  schools, defaultSchoolId, disabled,
}: {
  schools: { id: string; name: string }[];
  defaultSchoolId?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("TEACHER");
  const [schoolId, setSchoolId] = useState(defaultSchoolId ?? "");
  const [ownPassword, setOwnPassword] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await createUserAccount({
        email, name, role,
        schoolId: schoolId || null,
        password: ownPassword || undefined,
      });
      if (r.ok && r.password) {
        setCreated({ email: email.trim().toLowerCase(), password: r.password });
        setEmail(""); setName(""); setOwnPassword("");
      } else if (!r.ok) {
        setErr(r.error);
      }
    });
  }

  // The one moment the password is visible.
  if (created) {
    return (
      <div style={{ backgroundColor: "#fff", border: `1.5px solid ${GREEN}`, borderRadius: "16px", padding: "22px", marginBottom: "16px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: GREEN, margin: "0 0 12px" }}>
          Account created
        </p>
        <p style={{ fontSize: "14.5px", lineHeight: 1.6, color: "rgba(16,35,63,.75)", margin: "0 0 14px" }}>
          Give these to <strong style={{ color: INK }}>{created.email}</strong>. The password is not stored
          in readable form, so this is the only time it can be shown — they will be asked to change it when
          they first sign in.
        </p>
        <div style={{ backgroundColor: "#F4F7FD", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
          <p style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "13.5px", color: INK, margin: "0 0 5px", wordBreak: "break-all" }}>
            {created.email}
          </p>
          <p style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "17px", fontWeight: 700, color: BLUE, margin: 0, letterSpacing: "0.01em" }}>
            {created.password}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigator.clipboard?.writeText(`${created.email}\n${created.password}`)}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
              backgroundColor: INK, border: "none", borderRadius: "9999px", padding: "11px 20px",
              minHeight: "44px", cursor: "pointer",
            }}
          >
            Copy both
          </button>
          <button
            onClick={() => setCreated(null)}
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: BLUE, background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
          >
            Create another
          </button>
          <button
            onClick={() => { setCreated(null); setOpen(false); }}
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={{
          fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
          backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
          minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          whiteSpace: "nowrap",
        }}
      >
        + Create account
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ backgroundColor: "#fff", border: `1.5px solid ${BLUE}`, borderRadius: "16px", padding: "22px", marginBottom: "16px", width: "100%" }}
    >
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
        Create an account
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={label}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="teacher@school.org" style={field} autoFocus />
        </div>
        <div>
          <label style={label}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" style={field} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", marginBottom: "12px" }}>
        <div>
          <label style={label}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={field}>
            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <p style={{ fontSize: "12px", color: "rgba(16,35,63,.55)", margin: "5px 0 0", lineHeight: 1.45 }}>
            {ROLE_DESCRIPTIONS[role]}
          </p>
        </div>
        <div>
          <label style={label}>School</label>
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} style={field}>
            <option value="">No school</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {(role === "TEACHER" || role === "SCHOOL_ADMIN") && !schoolId && (
            <p style={{ fontSize: "12px", color: "#C96C00", margin: "5px 0 0", lineHeight: 1.45 }}>
              Without a school they will sign in and see nothing.
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={label}>Password</label>
        <input
          value={ownPassword}
          onChange={(e) => setOwnPassword(e.target.value)}
          placeholder="Leave empty and one will be generated"
          style={field}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending || !email.includes("@")}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 22px",
            minHeight: "44px", cursor: email.includes("@") ? "pointer" : "not-allowed",
            opacity: pending || !email.includes("@") ? 0.5 : 1,
          }}
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setErr(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "14px", color: "rgba(16,35,63,.6)", background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
        >
          Cancel
        </button>
        {err && <span style={{ fontSize: "13px", color: "#B8321E" }}>{err}</span>}
      </div>
    </form>
  );
}
