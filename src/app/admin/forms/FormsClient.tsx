"use client";

import Link from "next/link";
import { chip, R, C, pageTitle } from "@/lib/joc-tokens";
import { Absent } from "@/components/Absent";
import { useState } from "react";
import { saveForm, deleteForm } from "@/app/actions/forms";
import { Download } from "@/components/admin/Download";
import { FormBuilder, BLANK_FORM, type Draft } from "@/components/admin/FormBuilder";
import { PageIntro } from "@/components/admin/PageIntro";
import type { AdminFormRow, ResponseRow } from "@/lib/forms";

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: C.ink, backgroundColor: "#fff",
  border: `1px solid ${C.hairline}`, borderRadius: "10px",
  padding: "10px 12px", minHeight: "42px", outline: "none",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "#4A5A74", marginBottom: "5px",
};
const card: React.CSSProperties = {
  backgroundColor: "#fff", border: `1px solid ${C.hairline}`,
  borderRadius: "16px", padding: "20px", marginBottom: "14px",
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
        onSave={(d) =>
          saveForm({
            id: d.id || undefined, title: d.title, description: d.description,
            thankYou: d.thankYou, published: d.published, closed: d.closed,
            requiresSignIn: d.requiresSignIn,
            feeDollars: d.feeDollars ? Number(d.feeDollars) : null,
            feeLabel: d.feeLabel, fields: d.fields,
          })
        }
        onDelete={editing.id ? () => deleteForm(editing.id) : undefined}
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
          onClick={() => setEditing({ ...BLANK_FORM })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: R.chip, padding: "11px 20px",
            minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New form
        </button>
      </PageIntro>

      {forms.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: `1px dashed ${C.hairline}`, borderRadius: "16px", padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: "#4A5A74", margin: 0 }}>No forms yet.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
          {forms.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "15px 18px", borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: C.ink, margin: 0 }}>
                  {f.title}
                  {!f.published && <Pill tone="warn">draft</Pill>}
                  {f.closed && <Pill tone="bad">closed</Pill>}
                  {f.feeCents ? <Pill tone="good">${(f.feeCents / 100).toFixed(2)}</Pill> : null}
                </p>
                <p style={{ fontSize: "13px", color: "#4A5A74", margin: "3px 0 0" }}>
                  /forms/{f.slug} · {f.fields.length} question{f.fields.length === 1 ? "" : "s"} ·{" "}
                  {f.responseCount === 0 ? "no answers yet" : `${f.responseCount} answer${f.responseCount === 1 ? "" : "s"}`}
                </p>
              </div>
              {f.responseCount > 0 && (
                <Link
                  href={`/admin/forms?responses=${f.id}`}
                  style={{ fontSize: "13px", fontWeight: 600, color: C.ink, textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
                >
                  Answers
                </Link>
              )}
              {f.published && (
                <Link
                  href={`/forms/${f.slug}`}
                  target="_blank"
                  style={{ fontSize: "13px", color: "#4A5A74", textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
                >
                  View
                </Link>
              )}
              <button
                onClick={() => setEditing(toDraft(f))}
                disabled={disabled}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
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

function Pill({ tone, children }: { tone: "good" | "warn" | "bad"; children: React.ReactNode }) {
  const tint =
    tone === "good" ? { bg: C.greenTint, fg: C.greenText }
    : tone === "bad" ? { bg: C.redTint, fg: C.redText }
    : { bg: C.orangeTint, fg: C.orangeText };

  return (
    <span style={{ ...chip, color: tint.fg, backgroundColor: tint.bg, marginLeft: "8px" }}>
      {children}
    </span>
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
      <Link href="/admin/forms" style={{ fontSize: "13px", color: C.blue, textDecoration: "none", fontWeight: 600 }}>
        ← All forms
      </Link>
      <h1 style={pageTitle}>
        {form.title}
      </h1>
      <p style={{ fontSize: "14px", color: "#4A5A74", margin: "0 0 18px" }}>
        {rows.length} answer{rows.length === 1 ? "" : "s"}
        {form.feeCents ? ` · ${rows.filter((r) => r.paid).length} paid` : ""}
      </p>

      {rows.length > 0 && <Download formId={form.id} />}

      <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", minWidth: "760px" }}>
          <thead>
            <tr>
              {["When", "Name", "Email", ...(form.feeCents ? ["Paid"] : []), ...columns].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", borderBottom: `1px solid ${C.hairline}`, backgroundColor: C.panel, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={cell}>{r.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short" })}</td>
                <td style={{ ...cell, fontWeight: 600, color: C.ink }}>{r.name ?? <Absent>No name given</Absent>}</td>
                <td style={{ ...cell, wordBreak: "break-all" }}>{r.email ?? <Absent>No email given</Absent>}</td>
                {form.feeCents ? (
                  <td style={cell}>
                    <span style={{ fontSize: "12px", fontWeight: 700, borderRadius: R.chip, padding: "2px 9px", color: r.paid ? "#1D6B37" : "#C96C00", backgroundColor: r.paid ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)" }}>
                      {r.paid ? "paid" : "unpaid"}
                    </span>
                  </td>
                ) : null}
                {columns.map((c) => (
                  <td key={c} style={cell}>
                    {r.answers.find((a) => a.label === c)?.value ?? <Absent>Not answered</Absent>}
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
  borderBottom: `1px solid ${C.hairline}`,
  color: "#4A5A74",
  verticalAlign: "top",
};
