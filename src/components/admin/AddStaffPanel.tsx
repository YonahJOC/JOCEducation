"use client";

import { useState, useTransition } from "react";
import { label, R, C } from "@/lib/joc-tokens";
import { useRouter } from "next/navigation";
import { addSchoolStaff } from "@/app/actions/admin";

/**
 * Adding a member of staff at a school.
 *
 * This replaced an invitation panel. An invitation is a message to somebody
 * who has not agreed to hear from us, and until JOC launches no school is to
 * get one — the person is told by whoever at JOC is already speaking to them.
 * So the account is simply written, and nothing leaves the building.
 */

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: C.ink, backgroundColor: "#fff",
  border: `1px solid ${C.hairline}`, borderRadius: "10px",
  padding: "10px 12px", outline: "none", minHeight: "42px",
};

export function AddStaffPanel({ schoolId, disabled }: { schoolId: string; disabled?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TEACHER" | "SCHOOL_ADMIN">("TEACHER");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; good: boolean } | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await addSchoolStaff({ schoolId, name, email, role });
      if (r.ok) {
        setMsg({ text: `${name.trim()} added. They are not being told — that is yours to do.`, good: true });
        setName("");
        setEmail("");
        router.refresh();
      } else {
        setMsg({ text: r.error, good: false });
      }
    });
  }

  return (
    <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", padding: "20px" }}>
      <p style={{ ...label, color: "#4A5A74", margin: "0 0 6px" }}>
        Add a member of staff
      </p>
      <p style={{ fontSize: "15px", color: "#4A5A74", lineHeight: 1.55, margin: "0 0 14px", maxWidth: "58ch" }}>
        Their name and email makes them an account at this school. <strong style={{ color: C.ink }}>No
        message is sent to them</strong> — nothing goes out to a school until JOC launches. Tell
        them yourself, whenever you are ready.
      </p>

      <form onSubmit={submit}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          <span style={{ flex: "1 1 160px", minWidth: 0 }}>
            <label style={label} htmlFor={`staff-name-${schoolId}`}>Name</label>
            <input
              id={`staff-name-${schoolId}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morah Leah Stein"
              disabled={disabled || pending}
              style={field}
            />
          </span>
          <span style={{ flex: "2 1 220px", minWidth: 0 }}>
            <label style={label} htmlFor={`staff-email-${schoolId}`}>Email</label>
            <input
              id={`staff-email-${schoolId}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="leah@theirschool.org"
              type="email"
              disabled={disabled || pending}
              style={field}
            />
          </span>
        </div>

        <div style={{ marginBottom: "14px", maxWidth: "260px" }}>
          <label style={label} htmlFor={`staff-role-${schoolId}`}>What they are at the school</label>
          <select
            id={`staff-role-${schoolId}`}
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            disabled={disabled || pending}
            style={field}
          >
            <option value="TEACHER">Teacher — uses the materials</option>
            <option value="SCHOOL_ADMIN">School admin — runs their school&rsquo;s own panel</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={disabled || pending || !name.trim() || !email.trim()}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
              backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "12px 22px",
              minHeight: "44px", cursor: pending ? "wait" : "pointer",
              opacity: name.trim() && email.trim() && !disabled ? 1 : 0.5,
            }}
          >
            {pending ? "Adding…" : "Add them"}
          </button>
          {msg && (
            <span style={{ fontSize: "13px", color: msg.good ? "#1D6B37" : C.redText, lineHeight: 1.45, maxWidth: "42ch" }}>
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
