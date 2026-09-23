"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { logSchoolTouch } from "@/app/actions/school-status";
import { syncAppNow } from "@/app/actions/app-sync";
import { hours, type Flag } from "@/lib/app-flags";
import type { AppRow, AppActivity } from "@/lib/app-activity";

/**
 * All schools, on the JOC App's console.
 *
 * The list is the product. A coordinator opens this to find out who to ring,
 * so the schools that need ringing are at the top with the reason in words,
 * and everything else is arrangement below them.
 *
 * No student names anywhere. Aggregates only, except the name of the person
 * at the school who has to be rung back.
 */

const INK = "#10233F";
const BLUE = "#2D46AF";
const ORANGE = "#FA912D";
const ORANGE_TEXT = "#C96C00";
const PAPER = "#FBF9F4";
const PANEL = "#F4F7FD";
const GREEN = "#1B7F4B";
const RED = "#B8321E";
const MUTED = "rgba(16,35,63,.58)";
const HAIRLINE = "rgba(16,35,63,.1)";

const FLAG_COLOR: Record<Flag["kind"], string> = {
  message: RED,
  hours: ORANGE_TEXT,
  drop: "#8A4FBF",
  quiet: "#5A6B86",
};

const when = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export function AppActivityPanel({ data }: { data: AppActivity }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{ marginBottom: "14px" }}>
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 6px" }}>
        All schools
      </p>

      {/* How old this is. Said before anything else, because every figure
          below depends on it. */}
      {!data.sync.connected ? (
        <Notice tone="warn" title="The JOC App is not connected yet">
          Nothing below can be read until the app is joined up. The rows show which schools are
          matched and ready, and nothing else — no figure here is a guess.
        </Notice>
      ) : data.sync.stale ? (
        <Notice tone="warn" title={data.sync.text}>
          The app is read every 15 minutes. Three runs have been missed, so treat everything below
          as out of date until it catches up.
        </Notice>
      ) : (
        <p style={{ fontSize: "12.5px", color: MUTED, margin: "0 0 14px" }}>{data.sync.text}</p>
      )}

      <ReadNow connected={data.sync.connected} />

      {data.unmatchedSchools > 0 && (
        <Notice tone="info" title={`${data.unmatchedSchools} ${data.unmatchedSchools === 1 ? "school is" : "schools are"} not matched to the app`}>
          A school reports nothing until somebody puts its JOC App id on its record. Matching is by
          id, never by name — “Yeshiva Darchei Torah” and “Darchei Torah” would never have lined up.
        </Notice>
      )}

      {data.rows.length === 0 ? (
        <div style={{ backgroundColor: "#fff", border: `1px dashed rgba(16,35,63,.2)`, borderRadius: "16px", padding: "36px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "15px", color: MUTED, margin: 0 }}>No schools on the system yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {data.rows.map((r) => (
            <Row key={r.schoolId} row={r} open={open === r.schoolId} onToggle={() => setOpen(open === r.schoolId ? null : r.schoolId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Notice({ tone, title, children }: { tone: "warn" | "info"; title: string; children: React.ReactNode }) {
  const warn = tone === "warn";
  return (
    <div style={{
      backgroundColor: warn ? "#FDEEDA" : PANEL,
      border: `1px solid ${warn ? "rgba(154,84,5,.25)" : "rgba(45,70,175,.18)"}`,
      borderRadius: "12px", padding: "13px 16px", margin: "0 0 14px",
    }}>
      <p style={{ fontSize: "13.5px", fontWeight: 700, color: warn ? "#9A5405" : INK, margin: "0 0 3px" }}>{title}</p>
      <p style={{ fontSize: "13px", lineHeight: 1.55, color: warn ? "#7C4A00" : MUTED, margin: 0, maxWidth: "70ch" }}>
        {children}
      </p>
    </div>
  );
}

function Row({ row, open, onToggle }: { row: AppRow; open: boolean; onToggle: () => void }) {
  const f = row.flag;
  const colour = f ? FLAG_COLOR[f.kind] : null;

  return (
    <div style={{
      backgroundColor: "#fff",
      border: `1px solid ${f ? `${colour}44` : HAIRLINE}`,
      borderRadius: "14px", overflow: "hidden",
    }}>
      <div className="joc-app-row">
        {/* The band: what is wrong, and the one figure that says how much. */}
        <div style={{
          backgroundColor: f ? `${colour}14` : PANEL,
          padding: "12px 14px", minWidth: 0,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px",
        }}>
          <span style={{ fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: f ? colour! : MUTED }}>
            {f ? f.label : "Taken this week"}
          </span>
          <span style={{ fontSize: "19px", fontWeight: 700, color: f ? colour! : INK, letterSpacing: "-0.02em" }}>
            {f ? f.figure : row.stats ? String(row.stats.opportunitiesThisWeek) : "—"}
          </span>
        </div>

        <div style={{ padding: "12px 14px", minWidth: 0 }}>
          <p style={{ fontSize: "15.5px", fontWeight: 600, color: INK, margin: "0 0 2px" }}>{row.name}</p>
          {f ? (
            <p style={{ fontSize: "13.5px", color: MUTED, margin: "0 0 6px", lineHeight: 1.45 }}>
              {f.reason}{" "}
              <span style={{ color: colour!, fontWeight: 600 }}>
                True for {f.days === 0 ? "less than a day" : `${f.days} day${f.days === 1 ? "" : "s"}`}.
              </span>
            </p>
          ) : !row.appSchoolId ? (
            <p style={{ fontSize: "13.5px", color: ORANGE_TEXT, margin: "0 0 6px", fontWeight: 600 }}>
              Not matched to the JOC App yet
            </p>
          ) : !row.stats ? (
            <p style={{ fontSize: "13.5px", color: ORANGE_TEXT, margin: "0 0 6px", fontWeight: 600 }}>
              The app has not reported this school yet
            </p>
          ) : null}

          <Badges row={row} />
        </div>

        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", justifyContent: "center", minWidth: 0 }}>
          <button
            type="button"
            onClick={onToggle}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 700,
              color: f ? "#fff" : INK, backgroundColor: f ? BLUE : "transparent",
              border: f ? `1.5px solid ${BLUE}` : `1.5px solid ${HAIRLINE}`,
              borderRadius: "9999px", padding: "10px 16px", minHeight: "44px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {open ? "Close" : f ? f.action.label : "Open school"}
          </button>
          <LogCall schoolId={row.schoolId} contact={row.contact} lastCall={row.lastCall} />
        </div>
      </div>

      {open && <Detail row={row} />}
    </div>
  );
}

/** The three things true of a school whether or not it is flagged. */
function Badges({ row }: { row: AppRow }) {
  const st = row.stats;
  const oldHours =
    st?.unapprovedOldestAt && (Date.now() - new Date(st.unapprovedOldestAt).getTime()) / 86400000 > 7;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      <Badge
        tone={row.payment.state === "paid" || row.payment.state === "granted" ? "good" : row.payment.state === "unpaid" ? "bad" : "warn"}
      >
        {row.payment.label}
      </Badge>

      {st?.storeRedeemedThisMonth == null ? (
        <Badge tone="warn">Prize store not open</Badge>
      ) : (
        <Badge tone="plain">{st.storeRedeemedThisMonth} redeemed this month</Badge>
      )}

      {!st ? null : st.unapprovedMinutes === 0 ? (
        <Badge tone="good">Nothing waiting</Badge>
      ) : (
        <Badge tone={oldHours ? "warn" : "plain"}>
          {hours(st.unapprovedMinutes)}h waiting
        </Badge>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: "good" | "bad" | "warn" | "plain"; children: React.ReactNode }) {
  const c =
    tone === "good" ? GREEN : tone === "bad" ? RED : tone === "warn" ? ORANGE_TEXT : "rgba(16,35,63,.6)";
  return (
    <span style={{
      fontSize: "11.5px", fontWeight: 600, color: c,
      backgroundColor: tone === "plain" ? "rgba(16,35,63,.05)" : `${c}16`,
      borderRadius: "9999px", padding: "3px 10px", whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/** Everything the app knows about one school. Opens under its row. */
function Detail({ row }: { row: AppRow }) {
  const st = row.stats;

  return (
    <div style={{ borderTop: `1px solid ${HAIRLINE}`, backgroundColor: PAPER, padding: "16px 14px" }}>
      {row.message && (
        <div style={{ backgroundColor: "#fff", border: `1px solid ${RED}33`, borderRadius: "12px", padding: "14px 16px", marginBottom: "14px" }}>
          <p style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: RED, margin: "0 0 6px" }}>
            Waiting on us
          </p>
          <p style={{ fontSize: "14.5px", color: INK, margin: "0 0 8px", lineHeight: 1.55 }}>{row.message.body}</p>
          <p style={{ fontSize: "12.5px", color: MUTED, margin: "0 0 10px" }}>
            {row.message.fromName ?? "Somebody at the school"} · {when(row.message.sentAt)}
          </p>
          {/* No reply box, on purpose. */}
          <p style={{ fontSize: "12.5px", color: ORANGE_TEXT, margin: 0, lineHeight: 1.5 }}>
            Replies can&rsquo;t go out to schools until JOC launches. Call instead, then log it.
          </p>
        </div>
      )}

      {!st ? (
        <p style={{ fontSize: "14px", color: ORANGE_TEXT, fontWeight: 600, margin: 0 }}>
          {row.appSchoolId
            ? "The JOC App has not reported this school yet."
            : "This school is not matched to the JOC App, so it reports nothing."}
        </p>
      ) : (
        <div className="joc-app-detail">
          <Cell label="Subscription">{row.payment.label}</Cell>

          <Cell label="Opportunities">
            {st.opportunitiesOpen} open now
            <Sub>{st.opportunitiesThisWeek} taken this week · {st.opportunitiesThisCycle} this cycle</Sub>
          </Cell>

          <Cell label="Prize store">
            {st.storeRedeemedThisMonth == null ? (
              <Absent>Not available yet</Absent>
            ) : (
              <>
                {st.storeRedeemedThisMonth} redeemed this month
                <Sub>
                  {st.storeTopPrize ? `Most popular: ${st.storeTopPrize}` : "No most-popular prize yet"}
                  {st.storeLastRedeemedAt ? ` · last ${when(st.storeLastRedeemedAt)}` : ""}
                </Sub>
              </>
            )}
          </Cell>

          <Cell label="Hours logged">
            {hours(st.minutesThisWeek)}h this week
            <Sub>{hours(st.minutesThisCycle)}h this cycle · {hours(st.minutesThisYear)}h this year</Sub>
          </Cell>

          <Cell label="Waiting for approval">
            {st.unapprovedMinutes === 0 ? (
              "Nothing waiting"
            ) : (
              <>
                {hours(st.unapprovedMinutes)}h
                <Sub>
                  {st.unapprovedEntries} {st.unapprovedEntries === 1 ? "entry" : "entries"} from{" "}
                  {st.unapprovedStudents} {st.unapprovedStudents === 1 ? "student" : "students"}
                  {st.unapprovedOldestAt ? ` · oldest ${when(st.unapprovedOldestAt)}` : ""}
                </Sub>
                <Sub>
                  {st.unapprovedThisWeek} this week · {st.unapprovedOneToTwo} one to two weeks ·{" "}
                  <span style={{ color: st.unapprovedOverTwo > 0 ? ORANGE_TEXT : undefined, fontWeight: st.unapprovedOverTwo > 0 ? 600 : undefined }}>
                    {st.unapprovedOverTwo} over two weeks
                  </span>
                </Sub>
              </>
            )}
          </Cell>

          <Cell label="Active students">
            {row.enrolment ? (
              <>
                {st.activeStudents} of {row.enrolment}
                <span aria-hidden="true" style={{ display: "block", height: "6px", borderRadius: "9999px", backgroundColor: "rgba(16,35,63,.08)", overflow: "hidden", marginTop: "7px" }}>
                  <span style={{ display: "block", height: "100%", width: `${Math.min(100, (st.activeStudents / row.enrolment) * 100)}%`, backgroundColor: BLUE }} />
                </span>
              </>
            ) : (
              <>
                {st.activeStudents} active
                <Sub>
                  <Absent>
                    Enrolment not recorded —{" "}
                    <Link href={`/admin/schools/${row.schoolId}`} style={{ color: ORANGE_TEXT, fontWeight: 700 }}>
                      add it
                    </Link>
                  </Absent>
                </Sub>
              </>
            )}
          </Cell>

          <Cell label="Challenges running">
            {row.challenges.length === 0 ? (
              <Absent>None running</Absent>
            ) : (
              row.challenges.map((c) => (
                <span key={c.title} style={{ display: "block", fontSize: "13.5px", marginBottom: "3px" }}>
                  {c.title}{" "}
                  <span style={{ color: MUTED }}>
                    — {c.joined === 0 ? "nobody joined" : `${Math.round((c.finished / c.joined) * 100)}% finished`}
                  </span>
                </span>
              ))
            )}
          </Cell>

          <Cell label="Last activity">
            {st.lastActivityText ? (
              <>
                {st.lastActivityText}
                {st.lastActivityAt && <Sub>{when(st.lastActivityAt)}</Sub>}
              </>
            ) : (
              <Absent>Nothing logged yet</Absent>
            )}
          </Cell>
        </div>
      )}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#fff", border: `1px solid ${HAIRLINE}`, borderRadius: "12px", padding: "13px 15px", minWidth: 0 }}>
      <p style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.4)", margin: "0 0 5px" }}>
        {label}
      </p>
      <div style={{ fontSize: "14.5px", color: INK, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

const Sub = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: "block", fontSize: "12.5px", color: MUTED, marginTop: "3px", lineHeight: 1.5 }}>{children}</span>
);

/** Absence in words, in orange — never a dash or a zero standing in for unknown. */
const Absent = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: ORANGE_TEXT, fontWeight: 600 }}>{children}</span>
);

function LogCall({
  schoolId, contact, lastCall,
}: {
  schoolId: string;
  contact: { name: string; phone: string | null } | null;
  lastCall: { at: Date; summary: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState("Spoke to contact");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (done) {
    return <span style={{ fontSize: "12.5px", color: GREEN, fontWeight: 600, textAlign: "center" }}>{done}</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE,
          background: "none", border: "none", cursor: "pointer", minHeight: "40px", whiteSpace: "nowrap",
        }}
      >
        Log a call
      </button>
    );
  }

  return (
    <div style={{ display: "grid", gap: "6px", minWidth: "200px" }}>
      {contact && (
        <p style={{ fontSize: "12.5px", color: MUTED, margin: 0 }}>
          {contact.name}
          {contact.phone && (
            <>
              {" · "}
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} style={{ color: BLUE, fontWeight: 600 }}>
                {contact.phone}
              </a>
            </>
          )}
        </p>
      )}
      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", border: `1px solid ${HAIRLINE}`, borderRadius: "8px", padding: "7px 9px", minHeight: "38px", backgroundColor: "#fff", color: INK }}
      >
        <option>Spoke to contact</option>
        <option>Left a message</option>
        <option>No answer</option>
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", border: `1px solid ${HAIRLINE}`, borderRadius: "8px", padding: "7px 9px", minHeight: "38px", backgroundColor: "#fff", color: INK }}
      />
      <span style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const summary = note.trim() ? `${outcome} — ${note.trim()}` : outcome;
              const r = await logSchoolTouch(schoolId, "CALL", summary);
              if (r.ok) {
                const at = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                setDone(`Called at ${at} · ${outcome.toLowerCase()}`);
              } else {
                setErr(r.error);
              }
            });
          }}
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "12.5px", fontWeight: 700, color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "8px", padding: "8px 14px",
            minHeight: "38px", cursor: pending ? "wait" : "pointer",
          }}
        >
          {pending ? "Saving…" : "Log it"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setErr(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "12.5px", color: MUTED, background: "none", border: "none", cursor: "pointer", minHeight: "38px" }}
        >
          Cancel
        </button>
      </span>
      {err && <span style={{ fontSize: "12px", color: RED }}>{err}</span>}
      {lastCall && !err && (
        <span style={{ fontSize: "11.5px", color: MUTED }}>Last called {when(lastCall.at)}</span>
      )}
    </div>
  );
}

/**
 * Read the app now.
 *
 * Shown whether or not the app is connected, on purpose — before it is
 * connected this is the only way to find out what is missing, and it says so
 * rather than being hidden until it would have worked.
 */
function ReadNow({ connected }: { connected: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ good: boolean; text: string } | null>(null);

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", margin: "0 0 14px" }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await syncAppNow();
            setMsg(
              r.ok
                ? {
                    good: true,
                    text:
                      `Read ${r.rows} school${r.rows === 1 ? "" : "s"}` +
                      (r.unmatched > 0
                        ? ` · ${r.unmatched} record${r.unmatched === 1 ? "" : "s"} from the app had no school here`
                        : ""),
                  }
                : { good: false, text: r.error },
            );
          });
        }}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600,
          color: INK, backgroundColor: "rgba(16,35,63,.06)", border: "none",
          borderRadius: "9999px", padding: "9px 16px", minHeight: "40px",
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "Reading…" : connected ? "Read the app now" : "Test the connection"}
      </button>
      {msg && (
        <span style={{ fontSize: "12.5px", color: msg.good ? GREEN : ORANGE_TEXT, lineHeight: 1.45, maxWidth: "52ch" }}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
