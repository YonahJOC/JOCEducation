"use client";

import Link from "next/link";
import { C } from "@/lib/joc-tokens";
import { Absent } from "@/components/Absent";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setProgramForm, setProgramLead, saveProgramForm, addProgramCoordinator } from "@/app/actions/forms";
import { Download } from "@/components/admin/Download";
import { FormBuilder, BLANK_FORM, type Draft } from "@/components/admin/FormBuilder";
import { FIELD_TYPE_LABELS } from "@/lib/forms";
import { AppActivityPanel } from "@/components/admin/AppActivityPanel";
import { ProgramLights } from "@/components/admin/ProgramLights";
import { ProgramSchools } from "@/components/admin/ProgramSchools";
import { ProgramReports } from "@/components/admin/ProgramReports";
import type { AppActivity } from "@/lib/app-activity";
import type { ProgramTraffic } from "@/lib/program-traffic";
import type { EnrolledRow } from "@/lib/program-enrollment";
import type { ProgramReporting } from "@/lib/ambassadors";
import type { ProgramAdminView } from "@/lib/program-admin";

const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)",
  borderRadius: "16px", padding: "20px", marginBottom: "14px",
};
const cell: React.CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid rgba(16,35,63,.05)",
  color: "#4A5A74", verticalAlign: "top",
};

export function ProgramAdminClient({
  view, forms, team, feeLabel, paymentsOn, appActivity = null, asCoordinator = false, traffic = null,
  enrolled = [], reporting = null,
}: {
  view: ProgramAdminView;
  forms: { id: string; title: string; responseCount: number }[];
  team: { id: string; name: string | null; email: string }[];
  feeLabel: string | null;
  paymentsOn: boolean;
  /** Only the JOC App has these, and only for whoever may see them. */
  appActivity?: AppActivity | null;
  /** Previewing the coordinator's view rather than your own. */
  asCoordinator?: boolean;
  /** Every school not in this program yet, and whether to approach it. */
  traffic?: ProgramTraffic | null;
  /** Every school that is in it, and how far along. */
  enrolled?: EnrolledRow[];
  /** What the student ambassadors have reported. Never carries a name. */
  reporting?: ProgramReporting | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [formId, setFormId] = useState(view.form?.id ?? "");
  const [leads, setLeads] = useState(view.leads.map((l) => l.id));
  const router = useRouter();

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

  const rows = view.responses;
  // Every label anybody has answered under, so a renamed question still shows.
  const columns = [
    ...(view.form?.fields.map((f) => f.label) ?? []),
    ...rows.flatMap((r) => r.answers.map((a) => a.label)),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div>
      <Link href="/admin/programs" style={{ fontSize: "13px", color: C.blue, textDecoration: "none", fontWeight: 600 }}>
        ← All programs
      </Link>

      <h1 style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.03em", color: C.ink, margin: "12px 0 4px" }}>
        {view.name}
      </h1>
      <p style={{ fontSize: "14px", color: "#4A5A74", margin: "0 0 4px" }}>
        /programs/{view.slug}
        {!view.published && " · draft"}
        {view.comingSoon && " · coming soon"}
      </p>
      {asCoordinator && (
        <div style={{ backgroundColor: "#10233F", borderRadius: "12px", padding: "12px 16px", margin: "12px 0 0", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13.5px", color: "#fff", lineHeight: 1.5, flex: 1, minWidth: "min(100%, 300px)" }}>
            You are seeing this the way <strong>whoever runs this program</strong> sees it — no
            editing the form, no coordinators panel, no app figures.
          </span>
          <Link
            href={`/admin/programs/${view.slug}`}
            style={{ fontSize: "13px", fontWeight: 700, color: "#10233F", backgroundColor: "#FA912D", borderRadius: "9999px", padding: "9px 16px", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Back to your own view
          </Link>
        </div>
      )}

      {!asCoordinator && (view.canEditForm || view.canSetCoordinators) && (
        <p style={{ margin: "12px 0 0" }}>
          <Link
            href={`/admin/programs/${view.slug}?as=coordinator`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              fontSize: "13px", fontWeight: 600, color: C.ink,
              backgroundColor: "rgba(16,35,63,.06)", borderRadius: "9999px",
              padding: "9px 16px", minHeight: "40px", textDecoration: "none",
            }}
          >
            See this as its coordinator does
          </Link>
        </p>
      )}

      {!asCoordinator && view.asLead && (
        <p style={{ fontSize: "13.5px", color: "#C96C00", backgroundColor: "#FFF0E0", borderRadius: "10px", padding: "10px 14px", margin: "12px 0 0", maxWidth: "62ch", lineHeight: 1.5 }}>
          You are down as running this program, so you can see its sign-ups. Everything else in the
          console stays as it was.
        </p>
      )}

      <div style={{ height: "22px" }} />

      {/* ── The form, edited right here ────────────────────────────────── */}
      <div style={{ marginBottom: "14px" }}>
        <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 6px" }}>
          Sign-up form
        </p>
        <p style={{ fontSize: "13.5px", color: "#4A5A74", margin: "0 0 12px", lineHeight: 1.55, maxWidth: "64ch" }}>
          {view.form?.published
            ? "This is live. What you change here is what a school sees when they press the button on the program page."
            : "Every program starts with the questions JOC asks any school. Cut what you do not need, add what you do, then tick Published to put it on the program page."}
        </p>

        {view.form && (
          <p style={{ fontSize: "13px", color: "#4A5A74", margin: "0 0 14px" }}>
            {view.form.published ? (
              <Pill color="#1D6B37">live on the program page</Pill>
            ) : view.form.closed ? (
              <Pill color="#A3261A">closed</Pill>
            ) : (
              <Pill color="#C96C00">draft — not on the program page yet</Pill>
            )}
            <Link href={`/forms/${view.form.slug}`} target="_blank" style={{ color: C.blue, fontWeight: 600, textDecoration: "none", marginLeft: "10px" }}>
              /forms/{view.form.slug}
            </Link>
            {feeLabel && <span style={{ marginLeft: "10px" }}>· {feeLabel}</span>}
          </p>
        )}

        {/* The builder itself, on the page rather than behind a button. The
            questions are the thing somebody opens this page to work on, so
            they are what the page shows. */}
        {view.canEditForm ? (
          <FormBuilder
            embedded
            initial={asDraft()}
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
            onDone={() => router.refresh()}
          />
        ) : view.form ? (
          <div style={card}>
            <p style={{ fontSize: "15.5px", fontWeight: 600, color: C.ink, margin: "0 0 12px" }}>
              {view.form.title}
            </p>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
              {view.form.fields.map((f, i) => (
                <li
                  key={f.id}
                  style={{
                    display: "flex", gap: "10px", alignItems: "baseline",
                    padding: "9px 12px", fontSize: "14px", color: C.ink,
                    backgroundColor: i % 2 ? "transparent" : "rgba(244,247,253,.75)",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(16,35,63,.35)", minWidth: "16px" }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {f.label}
                    {f.required && <span style={{ color: "#C96C00", marginLeft: "5px" }}>*</span>}
                  </span>
                  <span style={{ fontSize: "12px", color: "#4A5A74", whiteSpace: "nowrap" }}>
                    {FIELD_TYPE_LABELS[f.type]}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div style={card}>
            <p style={{ fontSize: "14px", color: "#4A5A74", margin: 0 }}>
              No form on this program yet.
            </p>
          </div>
        )}
      </div>

      {appActivity && <AppActivityPanel data={appActivity} />}

      <ProgramSchools
        programId={view.id}
        slug={view.slug}
        programName={view.name}
        rows={enrolled}
        canEdit={!asCoordinator || view.asLead}
      />

      {reporting && <ProgramReports programName={view.name} data={reporting} />}

      {traffic && (
        <ProgramLights programId={view.id} slug={view.slug} programName={view.name} data={traffic} />
      )}

      {/* ── Where it is running ────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: "flex", gap: "12px", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "6px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: 0 }}>
            Where it is running
          </p>
          <Link href="/admin/programming" style={{ fontSize: "13px", fontWeight: 600, color: C.blue, textDecoration: "none" }}>
            Open the calendar →
          </Link>
        </div>

        {view.runs.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#4A5A74", margin: 0, lineHeight: 1.55, maxWidth: "62ch" }}>
            Not booked in anywhere yet. Dates are set on the calendar — each one says which school,
            when, and who from JOC is running it.
          </p>
        ) : (
          <>
            <p style={{ fontSize: "13.5px", color: "#4A5A74", margin: "0 0 14px", lineHeight: 1.55, maxWidth: "62ch" }}>
              Every date this program is booked for. Set them on the calendar; this is the view of
              just yours.
            </p>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "1px" }}>
              {view.runs.map((r, i) => {
                const past = new Date(r.startsAt).getTime() < Date.now();
                return (
                  <li
                    key={r.id}
                    style={{
                      display: "flex", gap: "14px", alignItems: "baseline", flexWrap: "wrap",
                      padding: "11px 12px", borderRadius: "8px", minWidth: 0,
                      backgroundColor: i % 2 ? "transparent" : "rgba(244,247,253,.75)",
                      opacity: past ? 0.6 : 1,
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 700, color: C.ink, minWidth: "104px", whiteSpace: "nowrap" }}>
                      {new Date(r.startsAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: "14px", color: C.ink }}>
                      {r.schoolName ?? "Open to every school"}
                      {r.audience && (
                        <span style={{ color: "#4A5A74", fontSize: "12.5px" }}> · {r.audience}</span>
                      )}
                      {r.location && (
                        <span style={{ color: "#4A5A74", fontSize: "12.5px" }}> · {r.location}</span>
                      )}
                    </span>
                    {r.status !== "PLANNED" && (
                      <Pill color={r.status === "CANCELLED" ? "#A3261A" : r.status === "DONE" ? "#1D6B37" : "#C96C00"}>
                        {r.status.toLowerCase()}
                      </Pill>
                    )}
                    {/* An unpublished date is the team's working plan. A school
                        has not been told, and somebody looking at this list
                        needs to know that before they ring one. */}
                    {!r.published && <Pill color="#C96C00">not announced</Pill>}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      {/* ── Swapping the form out ──────────────────────────────────────── */}
      {view.canEditProgram && (
        <div style={card}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 6px" }}>
            Use a different form
          </p>
          <p style={{ fontSize: "13.5px", color: "#4A5A74", margin: "0 0 12px", lineHeight: 1.55, maxWidth: "62ch" }}>
            Each program has its own form already, so this is only for the case where two programs
            should share one. Changing it here does not delete the form that was attached before.
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
                fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink,
                backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "10px",
                padding: "10px 12px", minHeight: "42px", minWidth: "280px", outline: "none",
              }}
            >
            <option value="">No form — send schools to pricing instead</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
                {f.responseCount ? ` (${f.responseCount})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Who runs it ────────────────────────────────────────────────── */}
      {view.canSetCoordinators && (
        <div style={card}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 6px" }}>
            Program coordinators
          </p>
          <p style={{ fontSize: "13.5px", color: "#4A5A74", margin: "0 0 12px", lineHeight: 1.55, maxWidth: "62ch" }}>
            A lead can open this page and read these sign-ups, and nothing else in the console. It
            is not an admin type — they need no permissions at all.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {team.map((u) => {
              const on = leads.includes(u.id);
              return (
                <label key={u.id} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: C.ink, cursor: "pointer" }}>
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
                  <span style={{ fontSize: "12.5px", color: "#4A5A74" }}>{u.email}</span>
                </label>
              );
            })}
          </div>

          <AddCoordinator programId={view.id} />
        </div>
      )}

      {msg && (
        <p style={{ fontSize: "13.5px", color: C.redText, margin: "0 0 14px", lineHeight: 1.5 }}>{msg}</p>
      )}

      {/* ── The sign-ups ───────────────────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 12px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", margin: "0 0 4px" }}>
            Sign-ups
          </p>
          <p style={{ fontSize: "14px", color: "#4A5A74", margin: 0 }}>
            {rows.length === 0
              ? view.form
                ? "Nobody has signed up yet."
                : "Attach a form and sign-ups will appear here."
              : `${rows.length} so far${view.form?.feeCents ? ` · ${rows.filter((r) => r.paid).length} paid` : ""}`}
          </p>
          {rows.length > 0 && view.form && (
            <div style={{ marginTop: "12px" }}>
              <Download formId={view.form.id} />
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["When", "Name", "Email", ...(view.form?.feeCents ? ["Paid"] : []), ...columns].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "#4A5A74", borderBottom: "1px solid rgba(16,35,63,.08)", backgroundColor: "#FAFBFD", whiteSpace: "nowrap" }}>
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
                    <td style={{ ...cell, fontWeight: 600, color: C.ink }}>{r.name ?? <Absent>No name given</Absent>}</td>
                    <td style={{ ...cell, wordBreak: "break-all" }}>{r.email ?? <Absent>No email given</Absent>}</td>
                    {view.form?.feeCents ? (
                      <td style={cell}>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, borderRadius: "9999px", padding: "2px 9px", color: r.paid ? "#1D6B37" : "#C96C00", backgroundColor: r.paid ? "rgba(27,127,75,.1)" : "rgba(250,145,45,.14)" }}>
                          {r.paid ? "paid" : "unpaid"}
                        </span>
                      </td>
                    ) : null}
                    {columns.map((c) => (
                      <td key={c} style={cell}>{r.answers.find((a) => a.label === c)?.value ?? <Absent>Not answered</Absent>}</td>
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

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, color, backgroundColor: `${color}1f`, borderRadius: "9999px", padding: "3px 9px" }}>
      {children}
    </span>
  );
}

/**
 * Adding somebody who does not have an account yet.
 *
 * The tick list above only offers people who have already signed in, which
 * left a chicken and an egg: the person who runs the JOC App could not be
 * named until they signed in, and had no reason to sign in until they ran
 * something. Name and email is all it takes.
 */
function AddCoordinator({ programId }: { programId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600, color: C.blue,
          background: "none", border: "none", padding: "14px 0 0", cursor: "pointer", minHeight: "44px",
        }}
      >
        + Add someone who is not on this list
      </button>
    );
  }

  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${C.hairline}` }}>
      <p style={{ fontSize: "13.5px", color: "#4A5A74", lineHeight: 1.55, margin: "0 0 12px", maxWidth: "58ch" }}>
        Their name and email. It makes them an account and puts them down as running this program.
        They sign in with that address — no password is set here.
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          disabled={pending}
          autoFocus
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink, backgroundColor: "#fff",
            border: `1px solid ${C.hairline}`, borderRadius: "10px", padding: "10px 12px",
            minHeight: "42px", outline: "none", flex: "1 1 170px", minWidth: 0,
          }}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@justonechesed.org"
          type="email"
          disabled={pending}
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink, backgroundColor: "#fff",
            border: `1px solid ${C.hairline}`, borderRadius: "10px", padding: "10px 12px",
            minHeight: "42px", outline: "none", flex: "2 1 230px", minWidth: 0,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={pending || !name.trim() || !email.trim()}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await addProgramCoordinator(programId, { name, email });
              if (r.ok) { setName(""); setEmail(""); setOpen(false); router.refresh(); }
              else setErr(r.error);
            });
          }}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13.5px", color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "42px", cursor: pending ? "wait" : "pointer",
            opacity: name.trim() && email.trim() ? 1 : 0.5,
          }}
        >
          {pending ? "Adding…" : "Add them"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setErr(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: "#4A5A74", background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
        >
          Cancel
        </button>
        {err && <span style={{ fontSize: "13px", color: C.redText, lineHeight: 1.4 }}>{err}</span>}
      </div>
    </div>
  );
}
