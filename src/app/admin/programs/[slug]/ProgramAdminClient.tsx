"use client";

import Link from "next/link";
import { Absent } from "@/components/Absent";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setProgramForm, setProgramLead, saveProgramForm, addProgramCoordinator } from "@/app/actions/forms";
import { Download } from "@/components/admin/Download";
import { FormBuilder, BLANK_FORM, type Draft } from "@/components/admin/FormBuilder";
import { FIELD_TYPE_LABELS } from "@/lib/forms";
import { ProgramLights } from "@/components/admin/ProgramLights";
import { ProgramSchools } from "@/components/admin/ProgramSchools";
import type { TabKey } from "@/components/admin/ProgramConsoleHeader";
import {
  C, R, F, rowCard, sectionHeading, sectionIntro, label, chip,
  field, primaryButton, textButton, quietButton, datum,
} from "@/lib/joc-tokens";
import type { ProgramTraffic } from "@/lib/program-traffic";
import type { EnrolledRow } from "@/lib/program-enrollment";
import type { ProgramAdminView } from "@/lib/program-admin";

/**
 * Everything on the console that is not Today.
 *
 * A tab used to be `display: none` on a section that had still been built,
 * mounted and asked for its data — six sections' worth of form builder and
 * calendar on every view of a page showing one of them. A tab is an address
 * now, so a closed one is not rendered at all.
 */

/** A card that is a card rather than a row: the shadow, not a border. */
const card: React.CSSProperties = { ...rowCard, padding: "20px", marginBottom: "14px" };

const cell: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "15px",
  padding: "12px 16px", borderBottom: `1px solid ${C.hairline}`,
  color: C.muted, verticalAlign: "top",
};

const body: React.CSSProperties = {
  fontFamily: F.read, fontSize: "15px", color: C.muted, lineHeight: 1.5, maxWidth: "62ch",
};

export function ProgramAdminClient({
  view, forms, team, feeLabel, paymentsOn, asCoordinator = false, traffic = null,
  enrolled = [], tab = "today", today = null,
}: {
  view: ProgramAdminView;
  forms: { id: string; title: string; responseCount: number }[];
  team: { id: string; name: string | null; email: string }[];
  feeLabel: string | null;
  paymentsOn: boolean;
  /** Previewing the coordinator's view rather than your own. */
  asCoordinator?: boolean;
  /** Every school not in this program yet, and whether to approach it. */
  traffic?: ProgramTraffic | null;
  /** Every school that is in it, and how far along. */
  enrolled?: EnrolledRow[];
  /** Which section is open. An address, not state — see ProgramConsoleHeader. */
  tab?: TabKey;
  /** The Today tab, rendered by the page because it reads the database. */
  today?: React.ReactNode;
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
      {/* The band and the tabs are rendered by the page, above this. */}

      {tab === "today" && today}

      {tab === "schools" && (
        <ProgramSchools
          programId={view.id}
          slug={view.slug}
          programName={view.name}
          rows={enrolled}
          canEdit={!asCoordinator || view.asLead}
        />
      )}

      {tab === "not-in-yet" && traffic && (
        <ProgramLights programId={view.id} slug={view.slug} programName={view.name} data={traffic} />
      )}

      {/* ── Where it is running ────────────────────────────────────────── */}
      {tab === "calendar" && (
        <div style={card}>
          <div style={{ display: "flex", gap: "12px", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap" }}>
            <h2 style={{ ...sectionHeading, margin: 0 }}>Where it is running</h2>
            <Link href="/admin/programming" style={{ ...textButton, display: "inline-flex", alignItems: "center" }}>
              Open the calendar
            </Link>
          </div>

          {view.runs.length === 0 ? (
            <p style={{ ...body, margin: "10px 0 0" }}>
              Not booked in anywhere yet. Dates are set on the calendar — each one says which school,
              when, and who from JOC is running it.
            </p>
          ) : (
            <>
              <p style={{ ...sectionIntro, fontFamily: F.read, margin: "6px 0 14px" }}>
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
                        padding: "11px 12px", borderRadius: R.form, minWidth: 0,
                        backgroundColor: i % 2 ? "transparent" : C.panel,
                        opacity: past ? 0.6 : 1,
                      }}
                    >
                      <span style={{ ...datum, color: C.ink, minWidth: "112px", whiteSpace: "nowrap" }}>
                        {new Date(r.startsAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontFamily: F.ui, fontSize: "15px", color: C.ink }}>
                        {r.schoolName ?? "Open to every school"}
                        {r.audience && <span style={{ color: C.muted }}> · {r.audience}</span>}
                        {r.location && <span style={{ color: C.muted }}> · {r.location}</span>}
                      </span>
                      {r.status !== "PLANNED" && (
                        <Tag tone={r.status === "CANCELLED" ? "bad" : r.status === "DONE" ? "good" : "warn"}>
                          {r.status.toLowerCase()}
                        </Tag>
                      )}
                      {/* An unpublished date is the team's working plan. A school
                          has not been told, and somebody looking at this list
                          needs to know that before they ring one. */}
                      {!r.published && <Tag tone="warn">not announced</Tag>}
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      )}

      {/* ── The sign-up form ───────────────────────────────────────────── */}
      {tab === "setup" && (
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Sign-up form</h2>
          <p style={{ ...sectionIntro, fontFamily: F.read }}>
            {view.form?.published
              ? "This is live. What you change here is what a school sees when they press the button on the program page."
              : "Every program starts with the questions JOC asks any school. Cut what you do not need, add what you do, then tick Published to put it on the program page."}
          </p>

          {view.form && (
            <p style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", margin: "0 0 14px" }}>
              {view.form.published ? (
                <Tag tone="good">live on the program page</Tag>
              ) : view.form.closed ? (
                <Tag tone="bad">closed</Tag>
              ) : (
                <Tag tone="warn">draft — not on the program page yet</Tag>
              )}
              <Link href={`/forms/${view.form.slug}`} target="_blank" style={{ ...textButton, textDecoration: "underline" }}>
                /forms/{view.form.slug}
              </Link>
              {feeLabel && <span style={{ ...datum, color: C.muted }}>{feeLabel}</span>}
            </p>
          )}

          {/* The builder itself, on the page rather than behind a button. The
              questions are the thing somebody opens this tab to work on, so
              they are what it shows. */}
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
              <p style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 600, color: C.ink, margin: "0 0 12px" }}>
                {view.form.title}
              </p>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                {view.form.fields.map((f, i) => (
                  <li
                    key={f.id}
                    style={{
                      display: "flex", gap: "10px", alignItems: "baseline",
                      padding: "9px 12px", fontFamily: F.ui, fontSize: "15px", color: C.ink,
                      backgroundColor: i % 2 ? "transparent" : C.panel,
                      borderRadius: R.form,
                    }}
                  >
                    <span style={{ ...datum, color: C.muted, minWidth: "18px" }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {f.label}
                      {f.required && <span style={{ color: C.orangeText, marginLeft: "5px" }}>*</span>}
                    </span>
                    <span style={{ ...datum, color: C.muted, whiteSpace: "nowrap" }}>
                      {FIELD_TYPE_LABELS[f.type]}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div style={card}>
              <p style={{ ...body, margin: 0 }}>No form on this program yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Swapping the form out ──────────────────────────────────────── */}
      {tab === "setup" && view.canEditProgram && (
        <div style={card}>
          <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Use a different form</h2>
          <p style={{ ...sectionIntro, fontFamily: F.read }}>
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
            style={{ ...field, minWidth: "280px", width: "auto" }}
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
      {tab === "setup" && view.canSetCoordinators && (
        <div style={card}>
          <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Program coordinators</h2>
          <p style={{ ...sectionIntro, fontFamily: F.read }}>
            A lead can open this page and read these sign-ups, and nothing else in the console. It
            is not an admin type — they need no permissions at all.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {team.map((u) => {
              const on = leads.includes(u.id);
              return (
                <label
                  key={u.id}
                  style={{
                    display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap",
                    minHeight: "44px", padding: "4px 8px", borderRadius: R.form,
                    fontFamily: F.ui, fontSize: "15px", color: C.ink, cursor: "pointer",
                  }}
                >
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
                    style={{ width: "18px", height: "18px" }}
                  />
                  {u.name ?? u.email}
                  <span style={{ ...datum, color: C.muted }}>{u.email}</span>
                </label>
              );
            })}
          </div>

          <AddCoordinator programId={view.id} />
        </div>
      )}

      {msg && (
        <p style={{ fontFamily: F.ui, fontSize: "15px", color: C.redText, margin: "0 0 14px", lineHeight: 1.5 }}>
          {msg}
        </p>
      )}

      {/* ── The sign-ups ───────────────────────────────────────────────── */}
      {tab === "sign-ups" && (
        <div style={{ ...card, padding: 0 }}>
          <div style={{ padding: "20px 20px 14px" }}>
            <h2 style={{ ...sectionHeading, margin: "0 0 4px" }}>Sign-ups</h2>
            <p style={{ ...body, margin: 0 }}>
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
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr>
                    {["When", "Name", "Email", ...(view.form?.feeCents ? ["Paid"] : []), ...columns].map((h) => (
                      <th
                        key={h}
                        style={{
                          ...label, textAlign: "left", padding: "11px 16px",
                          color: C.muted, borderBottom: `1px solid ${C.hairline}`,
                          backgroundColor: C.panel, whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...cell, ...datum }}>
                        {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </td>
                      <td style={{ ...cell, fontWeight: 600, color: C.ink }}>{r.name ?? <Absent>No name given</Absent>}</td>
                      <td style={{ ...cell, wordBreak: "break-all" }}>{r.email ?? <Absent>No email given</Absent>}</td>
                      {view.form?.feeCents ? (
                        <td style={cell}>
                          <Tag tone={r.paid ? "good" : "warn"}>{r.paid ? "paid" : "unpaid"}</Tag>
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
      )}
      {!asCoordinator && (view.canEditForm || view.canSetCoordinators) && (
        <p style={{ margin: "18px 0 0" }}>
          <Link
            href={`/admin/programs/${view.slug}?tab=${tab}&as=coordinator`}
            style={{ ...textButton, display: "inline-flex", alignItems: "center" }}
          >
            See this as its coordinator does
          </Link>
        </p>
      )}
    </div>
  );
}

/** A fact about a row, in one of the three colours the site has for facts. */
function Tag({ tone, children }: { tone: "good" | "warn" | "bad"; children: React.ReactNode }) {
  const t =
    tone === "good" ? { bg: C.greenTint, fg: C.greenText }
    : tone === "bad" ? { bg: C.redTint, fg: C.redText }
    : { bg: C.orangeTint, fg: C.orangeText };

  return <span style={{ ...chip, backgroundColor: t.bg, color: t.fg }}>{children}</span>;
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
        style={{ ...textButton, background: "none", border: "none", padding: "14px 0 0", cursor: "pointer" }}
      >
        Add someone who is not on this list
      </button>
    );
  }

  return (
    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${C.hairline}` }}>
      <p style={{ ...body, maxWidth: "58ch", margin: "0 0 12px" }}>
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
          style={{ ...field, flex: "1 1 170px", minWidth: 0, width: "auto" }}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@justonechesed.org"
          type="email"
          disabled={pending}
          style={{ ...field, flex: "2 1 230px", minWidth: 0, width: "auto" }}
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
            ...primaryButton,
            cursor: pending ? "wait" : "pointer",
            opacity: name.trim() && email.trim() ? 1 : 0.5,
          }}
        >
          {pending ? "Adding…" : "Add them"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setErr(null); }} style={quietButton}>
          Cancel
        </button>
        {err && <span style={{ fontFamily: F.ui, fontSize: "14px", color: C.redText, lineHeight: 1.4 }}>{err}</span>}
      </div>
    </div>
  );
}
