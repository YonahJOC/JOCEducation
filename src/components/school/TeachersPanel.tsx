"use client";

import { useState, useTransition } from "react";
import { inviteTeacher, cancelInvitation, removeTeacher, setTeacherRole } from "@/app/actions/school";

const INK = "#10233F";
const BLUE = "#2D46AF";
const GREEN = "#1B7F4B";
const RED = "#B91C1C";
const RULE = "rgba(16,35,63,.14)";

type Member = {
  id: string; name: string | null; email: string; role: string;
  active: boolean; lastSeenAt: Date | string | null;
};
type Invite = { id: string; email: string; role: string; status: string; expiresAt: Date | string };

const field: React.CSSProperties = {
  fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "10px", padding: "10px 12px",
  outline: "none", minHeight: "44px",
};

function ago(d: Date | string | null) {
  if (!d) return "never signed in";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function TeachersPanel({
  schoolName, members, invitations, seats, seatsUsed, meId,
}: {
  schoolName: string;
  members: Member[];
  invitations: Invite[];
  seats: number | null;
  seatsUsed: number;
  meId: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TEACHER" | "SCHOOL_ADMIN">("TEACHER");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const full = Boolean(seats && seatsUsed + invitations.filter((i) => i.status === "PENDING").length >= seats);

  function invite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await inviteTeacher(email, role);
      if (r.ok) { setEmail(""); setMsg({ kind: "ok", text: "Invitation created." }); }
      else setMsg({ kind: "err", text: r.error });
    });
  }

  const admins = members.filter((m) => m.role === "SCHOOL_ADMIN");

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "0 0 4px" }}>
        Your teachers
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 18px" }}>
        Everyone at {schoolName} with a JOC Education login.
      </p>

      {/* The scoping boundary, stated plainly. */}
      <div
        style={{
          backgroundColor: "#F4F7FD", border: "1px solid rgba(45,70,175,.18)",
          borderRadius: "14px", padding: "13px 16px", marginBottom: "20px",
        }}
      >
        <p style={{ fontSize: "13.5px", lineHeight: 1.55, color: INK, margin: 0 }}>
          You are administering <strong>{schoolName}</strong>. This is the only school you can see.
        </p>
      </div>

      {/* Seats */}
      {seats !== null && (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "18px 20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "8px" }}>
            <span style={{ color: INK, fontWeight: 600 }}>{seatsUsed} of {seats} seats used</span>
            <span style={{ color: full ? "#C96C00" : "rgba(16,35,63,.55)" }}>
              {full ? "All seats taken" : `${seats - seatsUsed} available`}
            </span>
          </div>
          <div style={{ height: "6px", borderRadius: "9999px", backgroundColor: "rgba(16,35,63,.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (seatsUsed / seats) * 100)}%`, backgroundColor: full ? "#FA912D" : BLUE, borderRadius: "9999px" }} />
          </div>
        </div>
      )}

      {/* Invite */}
      <form
        onSubmit={invite}
        style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}
      >
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
          Invite a teacher
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" placeholder="teacher@yourschool.org"
            style={{ ...field, flex: "1 1 220px", minWidth: "180px" }}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} style={{ ...field, width: "auto" }}>
            <option value="TEACHER">Teacher</option>
            <option value="SCHOOL_ADMIN">School admin</option>
          </select>
          <button
            type="submit"
            disabled={pending || full || !email.includes("@")}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
              backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 22px",
              minHeight: "44px", cursor: full || !email.includes("@") ? "not-allowed" : "pointer",
              opacity: pending || full || !email.includes("@") ? 0.5 : 1,
            }}
          >
            Invite
          </button>
        </div>
        {full && (
          <p style={{ fontSize: "13px", color: "#C96C00", margin: "10px 0 0" }}>
            Every seat is in use. Ask JOC for more on the Plan &amp; seats page.
          </p>
        )}
        {msg && (
          <p style={{ fontSize: "13px", margin: "10px 0 0", color: msg.kind === "ok" ? GREEN : RED }}>{msg.text}</p>
        )}
      </form>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 14px" }}>
            Invited, not yet joined
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {invitations.map((i) => {
              const expired = i.status === "EXPIRED" || new Date(i.expiresAt) < new Date();
              return (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: "14px", color: INK, wordBreak: "break-all" }}>{i.email}</span>
                    <span style={{ fontSize: "12.5px", color: expired ? "#C96C00" : "rgba(16,35,63,.5)", marginLeft: "8px" }}>
                      {expired ? "expired" : "pending"}
                    </span>
                  </div>
                  <Action label="Cancel" danger onRun={() => cancelInvitation(i.id)} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: 0, padding: "16px 20px", borderBottom: `1px solid rgba(16,35,63,.08)` }}>
          On your team ({members.length})
        </p>
        {members.length === 0 ? (
          <p style={{ padding: "20px", fontSize: "14px", color: "rgba(16,35,63,.5)", margin: 0 }}>
            Nobody has joined yet. Invite your first teacher above.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", padding: "14px 20px", borderBottom: "1px solid rgba(16,35,63,.05)", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "14.5px", fontWeight: 600, color: INK, margin: 0 }}>
                    {m.name ?? m.email}
                    {m.id === meId && <span style={{ fontSize: "12px", color: "rgba(16,35,63,.5)", fontWeight: 500 }}> · you</span>}
                  </p>
                  <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)", margin: "2px 0 0", wordBreak: "break-all" }}>
                    {m.email} · {ago(m.lastSeenAt)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                    color: m.role === "SCHOOL_ADMIN" ? BLUE : "rgba(16,35,63,.5)",
                    backgroundColor: m.role === "SCHOOL_ADMIN" ? "#F4F7FD" : "transparent",
                    padding: m.role === "SCHOOL_ADMIN" ? "3px 9px" : 0, borderRadius: "9999px",
                  }}>
                    {m.role === "SCHOOL_ADMIN" ? "Admin" : "Teacher"}
                  </span>
                  {m.id !== meId && (
                    <>
                      <Action
                        label={m.role === "SCHOOL_ADMIN" ? "Make teacher" : "Make admin"}
                        onRun={() => setTeacherRole(m.id, m.role === "SCHOOL_ADMIN" ? "TEACHER" : "SCHOOL_ADMIN")}
                      />
                      <Action label="Remove" danger confirm={`Remove ${m.email} from ${schoolName}?`} onRun={() => removeTeacher(m.id)} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Who can administer */}
      <div style={{ backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "16px", padding: "20px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 10px" }}>
          Who can administer this school
        </p>
        <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(16,35,63,.72)", margin: "0 0 10px" }}>
          {admins.length === 1
            ? "You are the only administrator."
            : `${admins.length} people can manage this school's teachers and plan.`}{" "}
          Just One Chesed named the first administrator; you can promote colleagues above.
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {admins.map((a) => (
            <span key={a.id} style={{ fontSize: "13px", color: INK, backgroundColor: "#F4F7FD", borderRadius: "9999px", padding: "5px 12px" }}>
              {a.name ?? a.email}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Action({
  label, onRun, danger, confirm,
}: {
  label: string;
  onRun: () => Promise<{ ok: boolean; error?: string }>;
  danger?: boolean;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
      <button
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setErr(null);
          start(async () => {
            const r = await onRun();
            if (!r.ok) setErr(r.error ?? "Failed");
          });
        }}
        disabled={pending}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 600,
          color: danger ? RED : BLUE, background: "none", border: "none",
          cursor: pending ? "default" : "pointer", padding: 0, minHeight: "38px",
          opacity: pending ? 0.5 : 1, whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
      {err && <span style={{ fontSize: "11.5px", color: RED }}>{err}</span>}
    </span>
  );
}
