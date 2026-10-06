"use client";

import { useState, useTransition } from "react";
import { saveStatus, moveStatus, deleteStatus, addCheck, addField } from "@/app/actions/app-board";
import { TONE } from "@/lib/board";
import { C, F, datum, primaryButton, secondaryButton } from "@/lib/joc-tokens";

/**
 * The board's own settings: its statuses, its extra columns, its ticks.
 *
 * All three were enums in the first draft, which would have meant a deploy
 * every time somebody wanted a new status. The Monday board let whoever ran
 * it rename a column on a Tuesday; if this cannot, people keep the Monday
 * board.
 *
 * A status in use cannot be deleted. Deleting would blank that column for
 * every school on it, and a board that loses data when somebody tidies it is
 * a board nobody tidies.
 */

const TONES = ["red", "orange", "blue", "green", "ink"];

export function StatusEditor({
  statuses, fields, checks,
}: {
  statuses: { id: string; label: string; tone: string; sort: number; used: number }[];
  fields: { id: string; label: string }[];
  checks: { id: string; label: string }[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState("");
  const [newField, setNewField] = useState("");
  const [newCheck, setNewCheck] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      setError(res.ok ? null : res.error ?? "That didn't save.");
    });

  return (
    <div style={{ display: "grid", gap: "22px", maxWidth: "720px" }}>
      <section>
        <h2 style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
          Statuses
        </h2>
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 14px", maxWidth: "58ch" }}>
          The order here is the order the board groups by. Put what is wrong at the top.
        </p>

        <div style={{ display: "grid", gap: "8px" }}>
          {statuses.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap",
                backgroundColor: C.white, border: `1px solid ${C.hairline}`,
                borderRadius: "12px", padding: "10px 12px",
              }}
            >
              <button
                type="button"
                disabled={i === 0 || pending}
                onClick={() => run(() => moveStatus(s.id, "up"))}
                aria-label={`Move ${s.label} up`}
                style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  border: `1px solid ${C.hairline}`, background: C.white,
                  cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.35 : 1,
                }}
              >
                ↑
              </button>

              {/* The swatch cycles, so a colour is one click rather than a menu. */}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const next = TONES[(TONES.indexOf(s.tone) + 1) % TONES.length];
                  run(() => saveStatus(s.id, s.label, next));
                }}
                aria-label={`Change the colour of ${s.label}`}
                style={{
                  width: "36px", height: "36px", borderRadius: "10px", cursor: "pointer",
                  border: `2px solid ${TONE[s.tone]?.fg ?? C.muted}`,
                  backgroundColor: TONE[s.tone]?.bg ?? C.panel,
                }}
              />

              <input
                defaultValue={s.label}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== s.label) run(() => saveStatus(s.id, v, s.tone));
                }}
                style={{
                  flex: "1 1 160px", minWidth: 0, fontFamily: F.ui, fontSize: "15px",
                  fontWeight: 600, color: C.ink, backgroundColor: "transparent",
                  border: "none", padding: "8px 2px", minHeight: "36px",
                }}
              />

              <span style={{ ...datum, color: C.muted }}>
                {s.used === 0 ? "nobody" : `${s.used} school${s.used === 1 ? "" : "s"}`}
              </span>

              <button
                type="button"
                disabled={pending || s.used > 0}
                onClick={() => run(() => deleteStatus(s.id))}
                title={s.used > 0 ? "Move its schools somewhere else first" : "Remove it"}
                style={{
                  fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                  color: s.used > 0 ? C.muted : C.redText,
                  background: "none", border: "none",
                  cursor: s.used > 0 ? "not-allowed" : "pointer", minHeight: "36px",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          <input
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            placeholder="Another status"
            style={field}
          />
          <button
            type="button"
            disabled={pending || !adding.trim()}
            onClick={() => run(async () => {
              const res = await saveStatus(null, adding, "ink");
              if (res.ok) setAdding("");
              return res;
            })}
            style={{ ...primaryButton, cursor: "pointer" }}
          >
            Add a status
          </button>
        </div>
      </section>

      <section>
        <h2 style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
          Your own columns
        </h2>
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 12px", maxWidth: "58ch" }}>
          A box you fill in per school. Rename one by typing over its header on the board.
        </p>

        <p style={{ ...body, margin: "0 0 10px" }}>
          {fields.length === 0 ? "None yet." : fields.map((f) => f.label).join(" · ")}
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            placeholder="Another column"
            style={field}
          />
          <button
            type="button"
            disabled={pending || !newField.trim()}
            onClick={() => run(async () => {
              const res = await addField(newField);
              if (res.ok) setNewField("");
              return res;
            })}
            style={{ ...secondaryButton, cursor: "pointer" }}
          >
            Add a column
          </button>
        </div>
      </section>

      <section>
        <h2 style={{ fontFamily: F.ui, fontSize: "19px", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
          One-off ticks
        </h2>
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, margin: "0 0 12px", maxWidth: "58ch" }}>
          A thing that is either done for a school or not — &ldquo;sign printed&rdquo;. Ticking
          one records the day.
        </p>

        <p style={{ ...body, margin: "0 0 10px" }}>
          {checks.length === 0 ? "None yet." : checks.map((c) => c.label).join(" · ")}
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={newCheck}
            onChange={(e) => setNewCheck(e.target.value)}
            placeholder="Another tick"
            style={field}
          />
          <button
            type="button"
            disabled={pending || !newCheck.trim()}
            onClick={() => run(async () => {
              const res = await addCheck(newCheck);
              if (res.ok) setNewCheck("");
              return res;
            })}
            style={{ ...secondaryButton, cursor: "pointer" }}
          >
            Add a tick
          </button>
        </div>
      </section>

      {error && (
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, margin: 0 }}>{error}</p>
      )}
    </div>
  );
}

const body: React.CSSProperties = {
  fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.muted,
};

const field: React.CSSProperties = {
  flex: "1 1 200px", minWidth: 0, boxSizing: "border-box",
  fontFamily: F.read, fontSize: "15px", color: C.ink, backgroundColor: C.white,
  border: `1px solid ${C.hairline}`, borderRadius: "12px",
  padding: "10px 12px", minHeight: "44px",
};
