"use client";

import { useState, useTransition } from "react";
import {
  FIELD_TYPES, FIELD_TYPE_LABELS, NEEDS_OPTIONS, type FieldType,
} from "@/lib/forms";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#B8321E";
const RULE = "rgba(16,35,63,.15)";

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", minHeight: "42px", outline: "none",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "rgba(16,35,63,.6)", marginBottom: "5px",
};
const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)",
  borderRadius: "16px", padding: "20px", marginBottom: "14px",
};

export type Draft = {
  id: string;
  title: string;
  description: string;
  thankYou: string;
  published: boolean;
  closed: boolean;
  requiresSignIn: boolean;
  feeDollars: string;
  feeLabel: string;
  fields: { label: string; help: string; type: FieldType; required: boolean; options: string[] }[];
};

export const BLANK_FORM: Draft = {
  id: "", title: "", description: "",
  thankYou: "Thank you — we have your answers.",
  published: false, closed: false, requiresSignIn: false,
  feeDollars: "", feeLabel: "",
  fields: [{ label: "", help: "", type: "SHORT_TEXT", required: true, options: [] }],
};

/** `id` comes back on a create, so an embedded builder can keep editing it. */
export type SaveResult = { ok: true; id?: string } | { ok: false; error: string };

/**
 * One builder, two homes.
 *
 * It lives under Content → Forms for the education team, and again on each
 * program's own page so whoever runs that program can work on its sign-up
 * form without going looking for it. Who is allowed to save is not this
 * component's business — it takes an `onSave` and the action on the other end
 * decides.
 */
export function FormBuilder({
  initial, paymentsOn, disabled, onSave, onDelete, onDone, heading, backLabel, embedded,
}: {
  initial: Draft;
  paymentsOn: boolean;
  disabled?: boolean;
  onSave: (d: Draft) => Promise<SaveResult>;
  onDelete?: () => Promise<SaveResult>;
  onDone: () => void;
  heading?: string;
  backLabel?: string;
  /**
   * Sitting inside another page rather than replacing it — on a program's own
   * page, where the form is part of the page rather than somewhere you go.
   * Drops the back link and the title, which belong to the page around it.
   */
  embedded?: boolean;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  // Embedded, saving does not take you anywhere, so nothing on screen would
  // otherwise tell you it worked.
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setSaved(false);
    setD((p) => ({ ...p, [k]: v }));
  };
  const setField = (i: number, patch: Partial<Draft["fields"][number]>) => {
    setSaved(false);
    setD((p) => ({ ...p, fields: p.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaved(false);
    start(async () => {
      const r = await onSave(d);
      if (!r.ok) { setMsg(r.error); return; }
      // Embedded, the page stays where it is, so say so. Otherwise the
      // caller takes over — usually by going back to a list.
      if (embedded) { setSaved(true); if (r.id && !d.id) setD((p) => ({ ...p, id: r.id! })); }
      onDone();
    });
  }

  function remove() {
    if (!onDelete || !window.confirm(`Delete "${d.title}"?`)) return;
    start(async () => {
      const r = await onDelete();
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: embedded ? "none" : "820px" }}>
      {!embedded && (
        <>
          <button
            type="button"
            onClick={onDone}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
          >
            {backLabel ?? "← All forms"}
          </button>
          <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "0 0 20px" }}>
            {heading ?? (d.id ? d.title || "Edit form" : "New form")}
          </h1>
        </>
      )}

      <div style={card}>
        <div style={{ marginBottom: "12px" }}>
          <label style={label}>What is it called?</label>
          <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Israel trip registration" disabled={disabled} style={field} autoFocus={!embedded} />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label style={label}>What is it for?</label>
          <textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="A line or two the person reads before they start." disabled={disabled} style={{ ...field, resize: "vertical" }} />
        </div>
        <div>
          <label style={label}>What they see after sending it</label>
          <input value={d.thankYou} onChange={(e) => set("thankYou", e.target.value)} disabled={disabled} style={field} />
        </div>
      </div>

      <div style={card}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 6px" }}>
          Questions
        </p>
        <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", margin: "0 0 14px", lineHeight: 1.55 }}>
          Name and email are always asked for — you do not need to add them.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {d.fields.map((f, i) => (
            <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: "12px", padding: "14px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(16,35,63,.45)", minWidth: "26px" }}>
                  {i + 1}
                </span>
                <input
                  value={f.label}
                  onChange={(e) => setField(i, { label: e.target.value })}
                  placeholder="What are you asking?"
                  disabled={disabled}
                  style={{ ...field, flex: 1 }}
                />
                <select
                  value={f.type}
                  onChange={(e) => setField(i, { type: e.target.value as FieldType })}
                  disabled={disabled}
                  style={{ ...field, width: "auto", minWidth: "150px" }}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <input
                value={f.help}
                onChange={(e) => setField(i, { help: e.target.value })}
                placeholder="A hint under the question (optional)"
                disabled={disabled}
                style={{ ...field, marginBottom: "10px" }}
              />

              {NEEDS_OPTIONS.includes(f.type) && (
                <div style={{ marginBottom: "10px" }}>
                  <label style={label}>The choices, one per line</label>
                  <textarea
                    value={f.options.join("\n")}
                    onChange={(e) => setField(i, { options: e.target.value.split("\n") })}
                    rows={3}
                    placeholder={"Grade 5\nGrade 6\nGrade 7"}
                    disabled={disabled}
                    style={{ ...field, resize: "vertical" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13.5px", color: INK, cursor: "pointer" }}>
                  <input type="checkbox" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} disabled={disabled} style={{ width: "16px", height: "16px" }} />
                  Must be answered
                </label>
                <button
                  type="button"
                  onClick={() => setD((p) => ({ ...p, fields: p.fields.filter((_, j) => j !== i) }))}
                  disabled={disabled || d.fields.length === 1}
                  style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: RED, background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setD((p) => ({ ...p, fields: [...p.fields, { label: "", help: "", type: "SHORT_TEXT", required: false, options: [] }] }))}
          disabled={disabled}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", marginTop: "12px", padding: 0 }}
        >
          + Add a question
        </button>
      </div>

      <div style={card}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 12px" }}>
          Payment
        </p>
        {!paymentsOn && (
          <p style={{ fontSize: "13.5px", color: "#9A5405", backgroundColor: "#FDEEDA", borderRadius: "10px", padding: "11px 14px", margin: "0 0 12px", lineHeight: 1.55 }}>
            Card payment is not switched on yet. You can set an amount, but the form will not publish
            until Stripe is connected — better that than taking registrations and never charging anyone.
          </p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
          <div>
            <label style={label}>Amount in dollars</label>
            <input
              type="number" min="0" step="0.01"
              value={d.feeDollars}
              onChange={(e) => set("feeDollars", e.target.value)}
              placeholder="Leave empty if it is free"
              disabled={disabled}
              style={field}
            />
          </div>
          <div>
            <label style={label}>What the charge is for</label>
            <input value={d.feeLabel} onChange={(e) => set("feeLabel", e.target.value)} placeholder="Trip deposit" disabled={disabled} style={field} />
          </div>
        </div>
      </div>

      <div style={{ ...card, display: "flex", gap: "18px", flexWrap: "wrap" }}>
        <Check checked={d.published} onChange={(v) => set("published", v)} disabled={disabled} label="Published — the link works" />
        <Check checked={d.closed} onChange={(v) => set("closed", v)} disabled={disabled} label="Closed — no longer taking answers" />
        <Check checked={d.requiresSignIn} onChange={(v) => set("requiresSignIn", v)} disabled={disabled} label="Must be signed in" />
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={disabled || pending || !d.title.trim()}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 24px",
            minHeight: "44px", cursor: pending ? "wait" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {d.id && onDelete && (
          <button
            type="button"
            onClick={remove}
            disabled={disabled || pending}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: RED, background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
          >
            Delete
          </button>
        )}
        {msg && <p style={{ fontSize: "13.5px", color: RED, margin: 0, lineHeight: 1.5, maxWidth: "46ch" }}>{msg}</p>}
        {saved && !msg && (
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1B7F4B", margin: 0 }}>Saved.</p>
        )}
      </div>
    </form>
  );
}

function Check({
  checked, onChange, disabled, label: text,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label style={{ display: "flex", gap: "9px", alignItems: "center", fontSize: "14px", color: INK, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} style={{ width: "16px", height: "16px" }} />
      {text}
    </label>
  );
}

