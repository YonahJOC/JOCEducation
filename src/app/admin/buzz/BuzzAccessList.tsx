"use client";

import { useMemo, useState, useTransition } from "react";
import { setBuzzAccess } from "@/app/actions/buzz-access";
import { C, R, F, label, datum } from "@/lib/joc-tokens";

/**
 * The list, with a switch against each name.
 *
 * Everybody at JOC is shown rather than only the people who already have it,
 * because the question being asked at this screen is "give it to Yakir", and
 * a list you have to add somebody to before you can find them answers a
 * different question.
 */

export type Row = {
  id: string;
  name: string | null;
  email: string;
  /** Switched on by name, on this page. */
  added: boolean;
  /** The name of their admin type, when that is what carries it. */
  viaType: string | null;
  superAdmin: boolean;
};

export function BuzzAccessList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<{ id: string; text: string } | null>(null);
  const [, start] = useTransition();

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const withEdits = rows.map((r) => ({ ...r, added: edits[r.id] ?? r.added }));
    // Everybody who has it, at the top, then the rest alphabetically.
    withEdits.sort((a, b) => {
      const ap = a.added || a.viaType || a.superAdmin ? 0 : 1;
      const bp = b.added || b.viaType || b.superAdmin ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    });
    if (!needle) return withEdits;
    return withEdits.filter(
      (r) => (r.name ?? "").toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle),
    );
  }, [rows, edits, q]);

  const toggle = (r: Row, on: boolean) => {
    setEdits((e) => ({ ...e, [r.id]: on }));
    setError(null);
    start(async () => {
      const res = await setBuzzAccess(r.id, on);
      if (!res.ok) {
        // Put the switch back and say why, under that row.
        setEdits((e) => {
          const next = { ...e };
          delete next[r.id];
          return next;
        });
        setError({ id: r.id, text: res.error });
      }
    });
  };

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a name or email"
        style={{
          width: "100%", boxSizing: "border-box", maxWidth: "420px",
          fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
          border: `1px solid ${C.hairline}`, borderRadius: "12px",
          padding: "11px 14px", minHeight: "46px", marginBottom: "14px",
        }}
      />

      {shown.length === 0 ? (
        <p style={{ fontFamily: F.read, fontSize: "16px", color: C.muted, margin: 0 }}>
          Nobody matches that.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {shown.map((r) => {
            const has = r.added || Boolean(r.viaType) || r.superAdmin;
            const locked = r.superAdmin || Boolean(r.viaType);
            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: C.white, borderRadius: "14px",
                  border: `1px solid ${has ? C.hairline : "transparent"}`,
                  boxShadow: "0 1px 0 #E3E6EF",
                  padding: "13px 16px",
                  display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "100 1 200px", minWidth: 0 }}>
                  <p style={{
                    fontFamily: F.ui, fontSize: "16px", fontWeight: 600, color: C.ink,
                    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {r.name ?? r.email}
                  </p>
                  <p style={{
                    ...datum, color: C.muted, margin: "2px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {r.name ? r.email : ""}
                    {r.superAdmin && (r.name ? " · SUPER ADMIN" : "SUPER ADMIN")}
                    {r.viaType && !r.superAdmin && ` · VIA ${r.viaType.toUpperCase()}`}
                  </p>
                  {error?.id === r.id && (
                    <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "6px 0 0" }}>
                      {error.text}
                    </p>
                  )}
                </div>

                {locked ? (
                  <span style={{
                    ...label, color: C.greenText, backgroundColor: C.greenTint,
                    borderRadius: R.chip, padding: "6px 10px", whiteSpace: "nowrap",
                  }}>
                    Has it
                  </span>
                ) : (
                  <Switch on={r.added} onChange={(on) => toggle(r, on)} name={r.name ?? r.email} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{
        fontFamily: F.read, fontSize: "14px", lineHeight: 1.6, color: C.muted,
        margin: "18px 0 0", maxWidth: "62ch",
      }}>
        Somebody whose admin type already carries the Buzz shows as{" "}
        <strong style={{ color: C.ink }}>Has it</strong> and cannot be switched off here — change
        it on their type, or change their type. School accounts are not listed: the Buzz is every
        school at once, so it is never theirs to see.
      </p>
    </div>
  );
}

/** A switch, because the answer is yes or no and there are forty of them. */
function Switch({
  on, onChange, name,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  name: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`The Buzz for ${name}`}
      onClick={() => onChange(!on)}
      style={{
        flex: "0 0 auto",
        display: "inline-flex", alignItems: "center", gap: "9px",
        fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
        color: on ? C.ink : C.muted,
        background: "none", border: "none", cursor: "pointer",
        padding: "6px 2px", minHeight: "40px",
      }}
    >
      <span style={{
        width: "42px", height: "24px", borderRadius: "999px", flex: "0 0 auto",
        backgroundColor: on ? C.blue : "#D7DBE6",
        position: "relative", transition: "background-color .15s",
      }}>
        <span style={{
          position: "absolute", top: "3px", left: on ? "21px" : "3px",
          width: "18px", height: "18px", borderRadius: "50%",
          backgroundColor: C.white, transition: "left .15s",
          boxShadow: "0 1px 2px rgba(16,35,63,.3)",
        }} />
      </span>
      {on ? "Can see it" : "No"}
    </button>
  );
}
