"use client";

import { useState, useTransition } from "react";
import { inviteToSchool, revokeInvitation } from "@/app/actions/admin";

const INK = "#10233F";
const RULE = "rgba(16,35,63,.15)";

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | string;
};

export function InvitePanel({
  schoolId, invitations, disabled,
}: {
  schoolId: string;
  invitations: Invitation[];
  disabled?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TEACHER");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await inviteToSchool({ schoolId, email, role });
      if (r.ok) { setEmail(""); setMsg("Invitation created."); }
      else setMsg(r.error);
    });
  }

  return (
    <div style={{ borderTop: "1px solid rgba(16,35,63,.08)", paddingTop: "14px" }}>
      {invitations.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "11.5px", fontWeight: 700, color: "rgba(16,35,63,.5)", margin: "0 0 8px", letterSpacing: "0.06em" }}>
            PENDING INVITATIONS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {invitations.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13.5px", color: INK, wordBreak: "break-all" }}>
                  {i.email}
                  <span style={{ color: "rgba(16,35,63,.5)", fontSize: "12px" }}> · {String(i.role).replace("_", " ").toLowerCase()}</span>
                </span>
                <button
                  onClick={() => start(async () => { await revokeInvitation(i.id, schoolId); })}
                  disabled={disabled || pending}
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", color: "#B8321E", background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", padding: 0, fontWeight: 600 }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", gap: "7px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Invite by email"
          style={{
            flex: "1 1 170px", minWidth: "150px", fontFamily: "var(--font-outfit)", fontSize: "13.5px",
            color: INK, backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
            padding: "9px 12px", outline: "none", minHeight: "40px",
          }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: INK, backgroundColor: "#fff",
            border: `1px solid ${RULE}`, borderRadius: "10px", padding: "9px 10px", outline: "none", minHeight: "40px",
          }}
        >
          <option value="TEACHER">Teacher</option>
          <option value="SCHOOL_ADMIN">School admin</option>
        </select>
        <button
          type="submit"
          disabled={disabled || pending || !email.includes("@")}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13.5px", color: "#fff",
            backgroundColor: "#2D46AF", border: "none", borderRadius: "9999px", padding: "10px 18px",
            minHeight: "40px",
            cursor: disabled || !email.includes("@") ? "not-allowed" : "pointer",
            opacity: disabled || pending || !email.includes("@") ? 0.5 : 1,
          }}
        >
          Invite
        </button>
      </form>
      {msg && (
        <p style={{ fontSize: "12.5px", margin: "9px 0 0", color: msg.includes("created") ? "#1B7F4B" : "#B8321E" }}>{msg}</p>
      )}
    </div>
  );
}
