"use client";

import Link from "next/link";
import { label as uiLabel, R, C } from "@/lib/joc-tokens";
import { useState, useTransition } from "react";
import { setSchoolMark, setUnapprovedHours, logSchoolTouch, type Mark } from "@/app/actions/school-status";
import type { SchoolStatusRow } from "@/lib/school-status";

function ago(d: Date | string | null): string {
  if (!d) return "Not yet";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const PAID_COLOR: Record<string, string> = {
  paid: C.greenText, granted: C.blue, trial: C.orangeText, overdue: C.redText, none: "#4A5A74",
};

export function StatusBoard({ schools, canEdit }: { schools: SchoolStatusRow[]; canEdit: boolean }) {
  if (schools.length === 0) {
    return (
      <div style={{ backgroundColor: "#fff", border: `1px dashed ${C.hairline}`, borderRadius: "16px", padding: "44px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 6px" }}>No schools yet.</p>
        <p style={{ fontSize: "15px", color: C.muted, margin: 0 }}>
          <Link href="/admin/schools" style={{ color: C.blue, fontWeight: 600, textDecoration: "none" }}>
            Add the first one →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {schools.map((s) => (
        <SchoolCard key={s.id} school={s} canEdit={canEdit} />
      ))}
    </div>
  );
}

function SchoolCard({ school: s, canEdit }: { school: SchoolStatusRow; canEdit: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [studentList, setStudentList] = useState(s.studentListAt);
  const [liveScreen, setLiveScreen] = useState(s.liveScreenAt);
  const [store, setStore] = useState(s.store.openedAt);

  const mark = (which: Mark, on: boolean, set: (d: Date | null) => void, prev: Date | null) => {
    set(on ? new Date() : null);
    setErr(null);
    start(async () => {
      const r = await setSchoolMark(s.id, which, on);
      if (!r.ok) { set(prev); setErr(r.error); }
    });
  };

  return (
    <div style={{ backgroundColor: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "16px", overflow: "hidden" }}>
      {/* Who, and whether they have paid — the two things that decide
          whether anything else on the row matters. */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", padding: "15px 18px", borderBottom: `1px solid ${C.hairline}` }}>
        <Link href={`/admin/schools/${s.id}`} style={{ fontSize: "16px", fontWeight: 600, color: C.ink, textDecoration: "none", minWidth: 0, flex: 1 }}>
          {s.name}
        </Link>
        <span style={{
          fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em",
          color: PAID_COLOR[s.paid.state], backgroundColor: `${PAID_COLOR[s.paid.state]}16`,
          borderRadius: R.chip, padding: "4px 11px", whiteSpace: "nowrap",
        }}>
          {s.paid.label}
        </span>
        {s.paid.until && (
          <span style={{ fontSize: "13px", color: C.muted, whiteSpace: "nowrap" }}>
            to {new Date(s.paid.until).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <div className="joc-status-grid">
        {/* Who runs it there */}
        <Cell label="Coordinator">
          {s.coordinator ? (
            <>
              <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>{s.coordinator.name}</span>
              {s.coordinator.title && <span style={{ color: C.muted, display: "block", fontSize: "13px" }}>{s.coordinator.title}</span>}
              {s.coordinator.email && (
                <span style={{ display: "block", fontSize: "13px", marginTop: "3px", wordBreak: "break-all" }}>
                  {s.coordinator.email}
                </span>
              )}
              {s.coordinator.phone && (
                <span style={{ display: "block", fontSize: "13px", color: C.muted }}>{s.coordinator.phone}</span>
              )}
            </>
          ) : (
            <Missing>Nobody named</Missing>
          )}
        </Cell>

        {/* The three dated milestones */}
        <Cell label="Student list">
          <Tick on={Boolean(studentList)} at={studentList} canEdit={canEdit} pending={pending}
            onChange={(v) => mark("studentList", v, setStudentList, studentList)}
            yes="Sent" no="Not sent yet" />
        </Cell>

        <Cell label="Live screen">
          <Tick on={Boolean(liveScreen)} at={liveScreen} canEdit={canEdit} pending={pending}
            onChange={(v) => mark("liveScreen", v, setLiveScreen, liveScreen)}
            yes="Up" no="Not up" />
        </Cell>

        <Cell label="School store">
          <Tick on={Boolean(store)} at={store} canEdit={canEdit} pending={pending}
            onChange={(v) => mark("store", v, setStore, store)}
            yes="Open" no="Not open" />
          {s.store.redeemedThisMonth != null && (
            <span style={{ display: "block", fontSize: "13px", color: C.muted, marginTop: "4px" }}>
              {s.store.redeemedThisMonth} redeemed this month · from the JOC App
            </span>
          )}
          {s.store.orders > 0 && (
            <span style={{ display: "block", fontSize: "13px", color: C.muted, marginTop: "4px" }}>
              {s.store.orders} order{s.store.orders === 1 ? "" : "s"} · last {ago(s.store.lastOrderAt)}
            </span>
          )}
        </Cell>

        {/* Waiting on somebody */}
        <Cell label="Unapproved hours">
          <Hours schoolId={s.id} initial={s.unapproved} canEdit={canEdit && !s.unapproved.synced} />
        </Cell>

        {/* Talked to, gone to */}
        <Cell label="Last conversation">
          {s.lastConversation ? (
            <>
              <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>{ago(s.lastConversation.at)}</span>
              <span style={{ display: "block", fontSize: "13px", color: C.muted, lineHeight: 1.45 }}>
                {s.lastConversation.kind.toLowerCase()} · {s.lastConversation.summary}
              </span>
            </>
          ) : (
            <Missing>Never</Missing>
          )}
        </Cell>

        <Cell label="Last visit">
          {s.lastVisit ? (
            <>
              <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>{ago(s.lastVisit.at)}</span>
              <span style={{ display: "block", fontSize: "13px", color: C.muted, lineHeight: 1.45 }}>{s.lastVisit.summary}</span>
            </>
          ) : (
            <Missing>Never</Missing>
          )}
          {canEdit && <LogTouch schoolId={s.id} />}
        </Cell>
      </div>

      {err && (
        <p style={{ fontSize: "13px", color: C.redText, margin: 0, padding: "0 18px 14px" }}>{err}</p>
      )}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "13px 18px", minWidth: 0 }}>
      <p style={{ ...uiLabel, color: "#4A5A74", margin: "0 0 6px" }}>
        {label}
      </p>
      <div style={{ fontSize: "15px", color: C.ink, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

/** Absence said out loud — a blank cell reads as "not loaded yet". */
function Missing({ children }: { children: React.ReactNode }) {
  return <span style={{ color: C.orangeText, fontWeight: 600 }}>{children}</span>;
}

function Tick({
  on, at, canEdit, pending, onChange, yes, no,
}: {
  on: boolean; at: Date | null; canEdit: boolean; pending: boolean;
  onChange: (v: boolean) => void; yes: string; no: string;
}) {
  if (!canEdit) {
    return on
      ? <span style={{ color: C.greenText, fontWeight: 600 }}>{yes} · {ago(at)}</span>
      : <Missing>{no}</Missing>;
  }
  return (
    <label style={{ display: "flex", gap: "8px", alignItems: "baseline", cursor: pending ? "wait" : "pointer" }}>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        disabled={pending}
        style={{ width: "16px", height: "16px", flexShrink: 0, cursor: "inherit" }}
      />
      <span style={{ minWidth: 0 }}>
        {on ? (
          <span style={{ color: C.greenText, fontWeight: 600 }}>{yes}</span>
        ) : (
          <Missing>{no}</Missing>
        )}
        {on && at && <span style={{ color: C.muted, display: "block", fontSize: "13px" }}>{ago(at)}</span>}
      </span>
    </label>
  );
}

/**
 * The hours figure, which somebody reads out of the JOC App and types here.
 * It always shows its own age, so nobody acts on a number from two months ago.
 */
function Hours({
  schoolId, initial, canEdit,
}: {
  schoolId: string;
  initial: { hours: number | null; checkedAt: Date | null; synced: boolean };
  canEdit: boolean;
}) {
  const [value, setValue] = useState(initial.hours === null ? "" : String(initial.hours));
  const [checkedAt, setCheckedAt] = useState(initial.checkedAt);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const age = staleWords(checkedAt);

  function save() {
    const n = value.trim() === "" ? null : Number(value);
    setErr(null);
    start(async () => {
      const r = await setUnapprovedHours(schoolId, n);
      if (r.ok) setCheckedAt(n === null ? null : new Date());
      else setErr(r.error);
    });
  }

  // Read out of the JOC App rather than typed. Said plainly, because a
  // figure a machine reads every 15 minutes and one somebody typed a
  // fortnight ago should not look the same.
  if (initial.synced) {
    return (
      <>
        <span style={{ fontWeight: 600, color: (initial.hours ?? 0) > 0 ? C.orangeText : C.ink }}>
          {initial.hours} hours
        </span>
        <span style={{ display: "block", fontSize: "13px", color: C.muted }}>
          from the JOC App · {age.text.replace("checked ", "")}
        </span>
      </>
    );
  }

  if (!canEdit) {
    return initial.hours === null
      ? <Missing>Not checked</Missing>
      : (
        <>
          <span style={{ fontWeight: 600, color: initial.hours > 0 ? C.orangeText : C.ink }}>{initial.hours} hours</span>
          <span style={{ display: "block", fontSize: "13px", color: age.stale ? C.orangeText : C.muted }}>{age.text}</span>
        </>
      );
  }

  return (
    <>
      <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={save}
          inputMode="numeric"
          placeholder="Not checked"
          disabled={pending}
          aria-label="Hours waiting for approval"
          style={{
            width: "62px", fontFamily: "var(--font-outfit)", fontSize: "15px", fontWeight: 600,
            color: C.ink, backgroundColor: "#fff", border: `1px solid ${C.hairline}`,
            borderRadius: "8px", padding: "6px 8px", minHeight: "34px", outline: "none",
          }}
        />
        <span style={{ fontSize: "13px", color: C.muted }}>hours</span>
      </span>
      <span style={{ display: "block", fontSize: "12px", color: age.stale ? C.orangeText : C.muted, marginTop: "4px" }}>
        {age.text}
      </span>
      {err && <span style={{ display: "block", fontSize: "12px", color: C.redText, marginTop: "3px" }}>{err}</span>}
    </>
  );
}

function staleWords(at: Date | null): { text: string; stale: boolean } {
  if (!at) return { text: "never checked", stale: true };
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86400000);
  if (days <= 0) return { text: "checked today", stale: false };
  if (days === 1) return { text: "checked yesterday", stale: false };
  if (days < 14) return { text: `checked ${days} days ago`, stale: false };
  if (days < 60) return { text: `checked ${Math.floor(days / 7)} weeks ago`, stale: true };
  return { text: `checked ${Math.floor(days / 30)} months ago`, stale: true };
}

/** Logging a visit where you noticed it was overdue, rather than elsewhere. */
function LogTouch({ schoolId }: { schoolId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"VISIT" | "CALL" | "EMAIL" | "MEETING" | "NOTE">("VISIT");
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.blue,
          background: "none", border: "none", padding: "6px 0 0", cursor: "pointer", minHeight: "34px",
        }}
      >
        + Log a visit or call
      </button>
    );
  }

  return (
    <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as typeof kind)}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", border: `1px solid ${C.hairline}`, borderRadius: "8px", padding: "6px 8px", minHeight: "34px", backgroundColor: "#fff", color: C.ink }}
      >
        <option value="VISIT">Visit</option>
        <option value="CALL">Call</option>
        <option value="EMAIL">Email</option>
        <option value="MEETING">Meeting</option>
        <option value="NOTE">Note</option>
      </select>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What happened, in a line"
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", border: `1px solid ${C.hairline}`, borderRadius: "8px", padding: "6px 8px", minHeight: "34px", backgroundColor: "#fff", color: C.ink }}
      />
      <span style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          disabled={pending || !text.trim()}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await logSchoolTouch(schoolId, kind, text);
              if (r.ok) { setOpen(false); setText(""); }
              else setErr(r.error);
            });
          }}
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 700, color: "#fff",
            backgroundColor: C.blue, border: "none", borderRadius: "8px", padding: "7px 14px",
            minHeight: "34px", cursor: pending ? "wait" : "pointer", opacity: text.trim() ? 1 : 0.5,
          }}
        >
          {pending ? "Saving…" : "Log it"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setErr(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: C.muted, background: "none", border: "none", cursor: "pointer", minHeight: "34px" }}
        >
          Cancel
        </button>
      </span>
      {err && <span style={{ fontSize: "12px", color: C.redText }}>{err}</span>}
    </div>
  );
}
