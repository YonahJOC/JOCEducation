"use client";

import { useState, useTransition } from "react";
import { setSchoolAppAdmin } from "@/app/actions/admin";

/**
 * "Runs the app" on one person at a school.
 *
 * Sits beside their role rather than inside it, because it is a different
 * question: the role is what they are to the account, this is whether they
 * look after what their students are doing.
 */
export function AppAdminToggle({
  userId, initial, disabled,
}: {
  userId: string;
  initial: boolean;
  disabled?: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
      <label
        title="Sees this school's own sign-ups and activity. Not the plan or the seats."
        style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12px", fontWeight: 600, color: on ? "#2D46AF" : "#4A5A74", cursor: disabled || pending ? "default" : "pointer", whiteSpace: "nowrap" }}
      >
        <input
          type="checkbox"
          checked={on}
          disabled={disabled || pending}
          onChange={(e) => {
            const next = e.target.checked;
            const prev = on;
            setOn(next);
            setErr(null);
            start(async () => {
              const r = await setSchoolAppAdmin(userId, next);
              if (!r.ok) { setOn(prev); setErr(r.error); }
            });
          }}
          style={{ width: "15px", height: "15px", cursor: "inherit" }}
        />
        Runs the app
      </label>
      {err && <span style={{ fontSize: "12px", color: "#A3261A", maxWidth: "24ch", textAlign: "right", lineHeight: 1.35 }}>{err}</span>}
    </span>
  );
}
