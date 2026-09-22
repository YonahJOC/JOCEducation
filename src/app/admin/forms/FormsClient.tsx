"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveForm, deleteForm } from "@/app/actions/forms";
import { PageIntro } from "@/components/admin/PageIntro";
import {
  FIELD_TYPES, FIELD_TYPE_LABELS, NEEDS_OPTIONS,
  type AdminFormRow, type FieldType, type ResponseRow,
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

type Draft = {
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

const BLANK: Draft = {
  id: "", title: "", description: "",
  thankYou: "Thank you — we have your answers.",
  published: false, closed: false, requiresSignIn: false,
  feeDollars: "", feeLabel: "",
  fields: [{ label: "", help: "", type: "SHORT_TEXT", required: true, options: [] }],
};

const STEPS = [
  "Press “+ New form”, give it a name, and write the line that explains what it is for.",
  "Add a question for each thing you need to know. Pick the kind of answer — short, long, a date, pick one, pick any.",
  "Name and email are always asked for; you do not add those. Without them an answer has nobody to reply to.",
  "Tick Published when it is ready. The link is education.justonechesed.org/forms/… — send that to whoever should fill it in.",
  "To charge for it, put an amount in. Nothing is charged until Stripe is connected, and a form with a fee will not publish until it is.",
  "When it is over, tick Closed rather than deleting it. People who already have the link are told it has closed, and the answers stay.",
];

export function FormsClient({
  forms, viewing, responses, paymentsOn, disabled,
}: {
  forms: AdminFormRow[];
  viewing: AdminFormRow | null;
  responses: ResponseRow[];
  paymentsOn: boolean;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState<Draft | null>(null);

  if (viewing) return <Responses form={viewing} rows={responses} />;
  if (editing) {
    return (
      <FormBuilder
        initial={editing}
        paymentsOn={paymentsOn}
        disabled={disabled}
        onDone={() => setEditing(null)}
      />
    );
  }

  const toDraft = (f: AdminFormRow): Draft => ({
    id: f.id, title: f.title, description: f.description, thankYou: f.thankYou,
    published: f.published, closed: f.closed, requiresSignIn: f.requiresSignIn,
    feeDollars: f.feeCents ? String(f.feeCents / 100) : "",
    feeLabel: f.feeLabel ?? "",
    fields: f.fields.map((x) => ({
      label: x.label, help: x.help ?? "", type: x.type, required: x.required, options: x.options,
    })),
  });

  return (
    <div>
      <PageIntro
        title="Forms"
        what="Build a form and send people the link — trip registration, a feedback round, a sign-up sheet. Answers come back here, and to the JOC inbox."
        steps={STEPS}
        note={
          paymentsOn
            ? "A form can charge a fee. People are sent to Stripe to pay, and the answer is marked paid only when Stripe confirms it."
            : "Card payment is not switched on yet, so a form with a fee will not publish. Everything else works."
        }
      >
        <button
          onClick={() => setEditing({ ...BLANK })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New form
        </button>
      </PageIntro>

      {forms.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: `1px dashed ${RULE}`, borderRadius: "16px", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.6)", margin: 0 }}>No forms yet.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden" }}>
          {forms.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "15px 18px", borderTop: i === 0 ? "none" : "1px solid rgba(16,35,63,.07)",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: INK, margin: 0 }}>
                  {f.title}
                  {!f.published && <Pill color="#C96C00">draft</Pill>}
                  {f.closed && <Pill color="#B8321E">closed</Pill>}
                  {f.feeCents ? <Pill color="#1B7F4B">${(f.feeCents / 100).toFixed(2)}</Pill> : null}
                </p>
                <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "3px 0 0" }}>
                  /forms/{f.slug} · {f.fields.length} question{f.fields.length === 1 ? "" : "s"} ·{" "}
                  {f.responseCount === 0 ? "no answers yet" : `${f.responseCount} answer${f.responseCount === 1 ? "" : "s"}`}
                </p>
              </div>
              {f.responseCount > 0 && (
                <Link
                  href={`/admin/forms?responses=${f.id}`}
                  style={{ fontSize: "13px", fontWeight: 600, color: INK, textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
                >
                  Answers
                </Link>
              )}
              {f.published && (
                <Link
                  href={`/forms/${f.slug}`}
                  target="_blank"
                  style={{ fontSize: "13px", color: "rgba(16,35,63,.55)", textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
                >
                  View
                </Link>
              )}
              <button
                onClick={() => setEditing(toDraft(f))}
                disabled={disabled}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, color, backgroundColor: `${color}1f`, borderRadius: "9999px", padding: "2px 8px", marginLeft: "8px" }}>
      {children}
    </span>
  );
}

function FormBuilder({
  initial, paymentsOn, disabled, onDone,
}: {
  initial: Draft;
  paymentsOn: boolean;
  disabled?: boolean;
  onDone: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const setField = (i: number, patch: Partial<Draft["fields"][number]>) =>
    setD((p) => ({ ...p, fields: p.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveForm({
        id: d.id || undefined,
        title: d.title,
        description: d.description,
        thankYou: d.thankYou,
        published: d.published,
        closed: d.closed,
        requiresSignIn: d.requiresSignIn,
        feeDollars: d.feeDollars ? Number(d.feeDollars) : null,
        feeLabel: d.feeLabel,
        fields: d.fields,
      });
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete "${d.title}"?`)) return;
    start(async () => {
      const r = await deleteForm(d.id);
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: "820px" }}>
      <button
        type="button"
        onClick={onDone}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
      >
        ← All forms
      </button>
      <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "0 0 20px" }}>
        {d.id ? d.title || "Edit form" : "New form"}
      </h1>

      <div style={card}>
        <div style={{ marginBottom: "12px" }}>
          <label style={label}>What is it called?</label>
          <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Israel trip registration" disabled={disabled} style={field} autoFocus />
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
        {d.id && (
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

function Responses({ form, rows }: { form: AdminFormRow; rows: ResponseRow[] }) {
  // Every label anybody has ever answered under, in the order the form asks
  // them now — so a renamed or removed question still shows its old answers.
  const columns = [
    ...form.fields.map((f) => f.label),
    ...rows.flatMap((r) => r.answers.map((a) => a.label)),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div>
      <Link href="/admin/forms" style={{ fontSize: "13px", color: BLUE, textDecoration: "none", fontWeight: 600 }}>
        ← All forms
      </Link>
      <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "12px 0 4px" }}>
        {form.title}
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 18px" }}>
        {rows.length} answer{rows.length === 1 ? "" : "s"}
        {form.feeCents ? ` · ${rows.filter((r) => r.paid).length} paid` : ""}
      </p>

      <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "760px" }}>
          <thead>
            <tr>
              {["When", "Name", "Email", ...(form.feeCents ? ["Paid"] : []), ...columns].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={cell}>{r.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short" })}</td>
                <td style={{ ...cell, fontWeight: 600, color: INK }}>{r.name ?? "—"}</td>
                <td style={{ ...cell, wordBreak: "break-all" }}>{r.email ?? "—"}</td>
                {form.feeCents ? (
                  <td style={cell}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, borderRadius: "9999px", padding: "2px 9px", color: r.paid ? "#1B7F4B" : "#C96C00", backgroundColor: r.paid ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)" }}>
                      {r.paid ? "paid" : "unpaid"}
                    </span>
                  </td>
                ) : null}
                {columns.map((c) => (
                  <td key={c} style={cell}>
                    {r.answers.find((a) => a.label === c)?.value ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cell: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid rgba(16,35,63,.05)",
  color: "rgba(16,35,63,.75)",
  verticalAlign: "top",
};
