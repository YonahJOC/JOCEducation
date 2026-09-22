"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setProgramForm, setProgramLead, saveProgramForm } from "@/app/actions/forms";
import { FormBuilder, BLANK_FORM, type Draft } from "@/components/admin/FormBuilder";
import type { ProgramAdminView } from "@/lib/program-admin";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#B8321E";
const RULE = "rgba(16,35,63,.15)";

const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)",
  borderRadius: "16px", padding: "20px", marginBottom: "14px",
};
const cell: React.CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid rgba(16,35,63,.05)",
  color: "rgba(16,35,63,.75)", verticalAlign: "top",
};

export function ProgramAdminClient({
  view, forms, team, feeLabel, paymentsOn,
}: {
  view: ProgramAdminView;
  forms: { id: string; title: string; responseCount: number }[];
  team: { id: string; name: string | null; email: string }[];
  feeLabel: string | null;
  paymentsOn: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [formId, setFormId] = useState(view.form?.id ?? "");
  const [leads, setLeads] = useState(view.leads.map((l) => l.id));
  const [building, setBuilding] = useState<Draft | null>(null);

  // The form itself, edited here rather than somewhere else. Whoever runs
  // this program can work on its sign-up form without being handed every
  // form on the site.
  const asDraft = (): Draft =>
    view.form
      ? {
          id: view.form.id,
          title: view.form.title,
          description: view.form.description,
          thankYou: view.form.thankYou,
          published: view.form.published,
          closed: view.form.closed,
          requiresSignIn: view.form.requiresSignIn,
          feeDollars: view.form.feeCents ? String(view.form.feeCents / 100) : "",
          feeLabel: view.form.feeLabel ?? "",
          fields: view.form.fields.map((x) => ({
            label: x.label, help: x.help ?? "", type: x.type,
            required: x.required, options: x.options,
          })),
        }
      : { ...BLANK_FORM, title: `${view.name} sign-up` };

  if (building) {
    return (
      <FormBuilder
        initial={building}
        paymentsOn={paymentsOn}
        onSave={(d) =>
          saveProgramForm(view.id, {
            id: d.id || undefined, title: d.title, description: d.description,
            thankYou: d.thankYou, published: d.published, closed: d.closed,
            requiresSignIn: d.requiresSignIn,
            feeDollars: d.feeDollars ? Number(d.feeDollars) : null,
            feeLabel: d.feeLabel, fields: d.fields,
          })
        }
        onDone={() => { setBuilding(null); window.location.reload(); }}
        heading={view.form ? `${view.name} — sign-up form` : `New form for ${view.name}`}
        backLabel={`← ${view.name}`}
      />
    );
  }


  const rows = view.responses;
  // Every label anybody has answered under, so a renamed question still shows.
  const columns = [
    ...(view.form?.fields.map((f) => f.label) ?? []),
    ...rows.flatMap((r) => r.answers.map((a) => a.label)),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div>
      <Link href="/admin/programs" style={{ fontSize: "13px", color: BLUE, textDecoration: "none", fontWeight: 600 }}>
        ← All programs
      </Link>

      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: INK, margin: "12px 0 4px" }}>
        {view.name}
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: "0 0 4px" }}>
        /programs/{view.slug}
        {!view.published && " · draft"}
        {view.comingSoon && " · coming soon"}
      </p>
      {view.asLead && (
        <p style={{ fontSize: "13.5px", color: "#9A5405", backgroundColor: "#FDEEDA", borderRadius: "10px", padding: "10px 14px", margin: "12px 0 0", maxWidth: "62ch", lineHeight: 1.5 }}>
          You are down as running this program, so you can see its sign-ups. Everything else in the
          console stays as it was.
        </p>
      )}

      <div style={{ height: "22px" }} />

      {/* ── The form ───────────────────────────────────────────────────── */}
      <div style={card}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 12px" }}>
          Sign-up form
        </p>

        {view.canEditProgram ? (
          <>
            <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", margin: "0 0 10px", lineHeight: 1.55 }}>
              Pick a form and it appears on this program&rsquo;s own page, in place of the plain
              Register button. Build forms under Content → Forms.
            </p>
            <select
              value={formId}
              onChange={(e) => {
                const next = e.target.value;
                const prev = formId;
                setFormId(next);
                setMsg(null);
                start(async () => {
                  const r = await setProgramForm(view.id, next || null);
                  if (!r.ok) { setFormId(prev); setMsg(r.error); }
                });
              }}
              disabled={pending}
              style={{
                fontFamily: "var(--font-outfit)", fontSize: "14px", color: INK,
                backgroundColor: "#fff", border: `1px solid ${RULE}`, borderRadius: "10px",
                padding: "10px 12px", minHeight: "42px", minWidth: "280px", outline: "none",
              }}
            >
              <option value="">No form — keep the Register button</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                  {f.responseCount ? ` (${f.responseCount})` : ""}
                </option>
              ))}
            </select>
          </>
        ) : view.form ? (
          <p style={{ fontSize: "14.5px", color: INK, margin: 0 }}>{view.form.title}</p>
        ) : (
          <p style={{ fontSize: "14px", color: "rgba(16,35,63,.55)", margin: 0 }}>
            No form on this program yet.
          </p>
        )}

        {view.canEditForm && (
          <button
            type="button"
            onClick={() => setBuilding(asDraft())}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13.5px",
              color: view.form ? BLUE : "#fff",
              backgroundColor: view.form ? "rgba(45,70,175,.08)" : BLUE,
              border: "none", borderRadius: "9999px", padding: "10px 18px",
              minHeight: "42px", cursor: "pointer", marginTop: "14px", display: "block",
            }}
          >
            {view.form ? "Edit the questions" : "Build a sign-up form"}
          </button>
        )}

        {view.form && (
          <p style={{ fontSize: "13px", color: "rgba(16,35,63,.55)", margin: "10px 0 0" }}>
            <Link href={`/forms/${view.form.slug}`} target="_blank" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>
              /forms/{view.form.slug}
            </Link>
            {!view.form.published && " · draft, so it is not on the page yet"}
            {view.form.closed && " · closed"}
            {feeLabel && ` · ${feeLabel}`}
          </p>
        )}
      </div>

      {/* ── Who runs it ────────────────────────────────────────────────── */}
      {view.canSetCoordinators && (
        <div style={card}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 6px" }}>
            Program coordinators
          </p>
          <p style={{ fontSize: "13.5px", color: "rgba(16,35,63,.6)", margin: "0 0 12px", lineHeight: 1.55, maxWidth: "62ch" }}>
            A lead can open this page and read these sign-ups, and nothing else in the console. It
            is not an admin type — they need no permissions at all.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {team.map((u) => {
              const on = leads.includes(u.id);
              return (
                <label key={u.id} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: INK, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => {
                      const next = on ? leads.filter((x) => x !== u.id) : [...leads, u.id];
                      const prev = leads;
                      setLeads(next);
                      setMsg(null);
                      start(async () => {
                        const r = await setProgramLead(view.id, u.id, !on);
                        if (!r.ok) { setLeads(prev); setMsg(r.error); }
                      });
                    }}
                    disabled={pending}
                    style={{ width: "16px", height: "16px" }}
                  />
                  {u.name ?? u.email}
                  <span style={{ fontSize: "12.5px", color: "rgba(16,35,63,.5)" }}>{u.email}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13.5px", color: RED, margin: "0 0 14px", lineHeight: 1.5 }}>{msg}</p>
      )}

      {/* ── The sign-ups ───────────────────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 12px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 4px" }}>
            Sign-ups
          </p>
          <p style={{ fontSize: "14px", color: "rgba(16,35,63,.6)", margin: 0 }}>
            {rows.length === 0
              ? view.form
                ? "Nobody has signed up yet."
                : "Attach a form and sign-ups will appear here."
              : `${rows.length} so far${view.form?.feeCents ? ` · ${rows.filter((r) => r.paid).length} paid` : ""}`}
          </p>
        </div>

        {rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["When", "Name", "Email", ...(view.form?.feeCents ? ["Paid"] : []), ...columns].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={cell}>
                      {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </td>
                    <td style={{ ...cell, fontWeight: 600, color: INK }}>{r.name ?? "—"}</td>
                    <td style={{ ...cell, wordBreak: "break-all" }}>{r.email ?? "—"}</td>
                    {view.form?.feeCents ? (
                      <td style={cell}>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, borderRadius: "9999px", padding: "2px 9px", color: r.paid ? "#1B7F4B" : "#C96C00", backgroundColor: r.paid ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)" }}>
                          {r.paid ? "paid" : "unpaid"}
                        </span>
                      </td>
                    ) : null}
                    {columns.map((c) => (
                      <td key={c} style={cell}>{r.answers.find((a) => a.label === c)?.value ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
