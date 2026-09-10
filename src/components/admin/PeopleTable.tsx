"use client";

import { useState, useTransition } from "react";
import { setUserRole, setUserActive, assignUserToSchool, resetUserPassword } from "@/app/actions/admin";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ASSIGNABLE_ROLES, type Role } from "@/lib/access";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RULE = "rgba(16,35,63,.15)";

export const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "#B8321E", ADMIN: "#2D46AF", STAFF: "#1B7F4B",
  SCHOOL_ADMIN: "#2C7AC9", TEACHER: "#7A8699",
};

export type PersonRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  lastSeenAt: Date | string | null;
  schoolName: string | null;
  schoolId?: string | null;
  hasPassword?: boolean;
};

export type SchoolRef = { id: string; name: string };

function ago(d: Date | string | null) {
  if (!d) return "never";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 20px", fontSize: "10.5px", letterSpacing: "0.16em",
  textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)",
  borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "12px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", verticalAlign: "middle",
};

export function PeopleTable({
  title, people, showSchool, canEditRoles, disabled, schools = [],
}: {
  title: string;
  people: PersonRow[];
  showSchool: boolean;
  canEditRoles: boolean;
  disabled?: boolean;
  schools?: SchoolRef[];
}) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0, padding: "16px 20px", borderBottom: "1px solid rgba(16,35,63,.08)" }}>
        {title}
      </p>
      {people.length === 0 ? (
        <p style={{ padding: "20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>Nobody yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: showSchool ? "720px" : "600px" }}>
            <thead>
              <tr>
                <th style={th}>Name</th>
                {showSchool && <th style={th}>School</th>}
                <th style={th}>Role</th>
                <th style={th}>Last seen</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <Row key={p.id} person={p} showSchool={showSchool} canEditRoles={canEditRoles} disabled={disabled} schools={schools} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({
  person, showSchool, canEditRoles, disabled, schools,
}: {
  person: PersonRow;
  showSchool: boolean;
  canEditRoles: boolean;
  disabled?: boolean;
  schools: SchoolRef[];
}) {
  const [role, setRole] = useState(person.role);
  const [active, setActive] = useState(person.active);
  const [schoolId, setSchoolId] = useState(person.schoolId ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  function changeSchool(next: string) {
    const prev = schoolId;
    setSchoolId(next);
    setMsg(null);
    start(async () => {
      const r = await assignUserToSchool(person.id, next || null);
      if (!r.ok) { setSchoolId(prev); setMsg(r.error); }
    });
  }

  function resetPassword() {
    if (!window.confirm(`Issue a new password for ${person.email}? Their current one stops working.`)) return;
    setMsg(null);
    start(async () => {
      const r = await resetUserPassword(person.id);
      if (r.ok && r.password) setNewPassword(r.password);
      else if (!r.ok) setMsg(r.error);
    });
  }

  function changeRole(next: string) {
    const prev = role;
    setRole(next);
    setMsg(null);
    start(async () => {
      const r = await setUserRole(person.id, next);
      if (!r.ok) { setRole(prev); setMsg(r.error); }
    });
  }

  function toggleActive() {
    const next = !active;
    if (!next && !window.confirm(`Suspend ${person.email}? They will not be able to sign in.`)) return;
    setActive(next);
    setMsg(null);
    start(async () => {
      const r = await setUserActive(person.id, next);
      if (!r.ok) { setActive(!next); setMsg(r.error); }
    });
  }

  return (
    <tr style={{ opacity: active ? 1 : 0.55 }}>
      <td style={td}>
        <span style={{ fontWeight: 600, color: INK, display: "block" }}>{person.name ?? "—"}</span>
        <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", wordBreak: "break-all" }}>{person.email}</span>
        {msg && <span style={{ display: "block", fontSize: "12px", color: "#B8321E", marginTop: "3px" }}>{msg}</span>}
        {newPassword && (
          <span style={{ display: "block", marginTop: "6px", backgroundColor: "#F4F7FD", borderRadius: "8px", padding: "7px 10px" }}>
            <span style={{ display: "block", fontSize: "11px", color: "rgba(16,35,63,.55)" }}>
              New password — shown once
            </span>
            <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "14px", fontWeight: 700, color: BLUE }}>
              {newPassword}
            </span>
          </span>
        )}
      </td>

      {showSchool && (
        <td style={{ ...td }}>
          {canEditRoles && schools.length > 0 ? (
            <select
              value={schoolId}
              onChange={(e) => changeSchool(e.target.value)}
              disabled={disabled || pending}
              style={{
                fontFamily: "var(--font-outfit)", fontSize: "13px",
                color: schoolId ? INK : "#C96C00", backgroundColor: "#fff",
                border: `1px solid ${RULE}`, borderRadius: "9px", padding: "7px 9px",
                minHeight: "38px", cursor: disabled ? "not-allowed" : "pointer", outline: "none",
                maxWidth: "180px",
              }}
            >
              <option value="">No school</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          ) : (
            <span style={{ color: "rgba(16,35,63,.75)" }}>
              {person.schoolName ?? <span style={{ color: "#C96C00" }}>no school</span>}
            </span>
          )}
        </td>
      )}

      <td style={td}>
        {canEditRoles ? (
          <select
            value={role}
            onChange={(e) => changeRole(e.target.value)}
            disabled={disabled || pending}
            title={ROLE_DESCRIPTIONS[role as Role]}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
              color: ROLE_COLOR[role] ?? INK, backgroundColor: "#fff",
              border: `1px solid ${RULE}`, borderRadius: "9px", padding: "7px 9px",
              minHeight: "38px", cursor: disabled ? "not-allowed" : "pointer", outline: "none",
            }}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        ) : (
          <span style={{
            display: "inline-block", fontSize: "11px", fontWeight: 700, padding: "3px 9px",
            borderRadius: "9999px", letterSpacing: "0.04em", whiteSpace: "nowrap",
            color: ROLE_COLOR[role] ?? "#7A8699", backgroundColor: `${ROLE_COLOR[role] ?? "#7A8699"}1a`,
          }}>
            {ROLE_LABELS[role as Role] ?? role}
          </span>
        )}
      </td>

      <td style={{ ...td, color: "rgba(16,35,63,.6)", whiteSpace: "nowrap" }}>{ago(person.lastSeenAt)}</td>

      <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
        {canEditRoles && (
          <span style={{ display: "inline-flex", gap: "14px", alignItems: "center" }}>
            <button
              onClick={resetPassword}
              disabled={disabled || pending}
              title="Issue a new password and show it once"
              style={{
                fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600,
                color: "#2D46AF", background: "none", border: "none",
                cursor: disabled ? "not-allowed" : "pointer", padding: "6px 0", minHeight: "38px",
              }}
            >
              Reset password
            </button>
            <button
              onClick={toggleActive}
              disabled={disabled || pending}
              style={{
                fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600,
                color: active ? "#B8321E" : "#1B7F4B", background: "none", border: "none",
                cursor: disabled ? "not-allowed" : "pointer", padding: "6px 0", minHeight: "38px",
              }}
            >
              {active ? "Suspend" : "Restore"}
            </button>
          </span>
        )}
      </td>
    </tr>
  );
}
