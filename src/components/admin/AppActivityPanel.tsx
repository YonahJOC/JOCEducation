"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { logSchoolTouch } from "@/app/actions/school-status";
import { syncAppNow } from "@/app/actions/app-sync";
import { hours, schoolYear, compareRows } from "@/lib/app-flags";
import {
  C, R, ROW_SHADOW, CONTENT_MAX, primaryButton, secondaryButton, chip, bandLabel,
  bandFigure, rowCard, rowInner, rowBody, rowAction, rowDetail, rowTitle, field,
  note,
} from "@/lib/joc-tokens";
import type { AppRow, AppActivity } from "@/lib/app-activity";

/**
 * The JOC App's schools, worst first.
 *
 * Only schools that are actually on the app. One that is not has no figures,
 * and a row full of dashes reads as "broken" rather than "not applicable" —
 * those schools belong in the traffic light instead.
 *
 * No student names anywhere. Aggregates only, except the name of the person
 * at the school who has to be rung back.
 */

const when = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export function AppActivityPanel({ data }: { data: AppActivity }) {
  const [open, setOpen] = useState<string | null>(null);
  const { rows, replay, animating } = useRiseToTop(data.rows);

  return (
    <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto 16px" }}>
      <Hero data={data} />

      <div style={{ display: "flex", gap: "12px", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", margin: "24px 0 2px" }}>
        <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: 0 }}>
          All schools on the app
        </h2>
        {data.flagged > 0 && (
          <button
            type="button"
            onClick={replay}
            disabled={animating}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.blue,
              background: "none", border: "none", textDecoration: "underline",
              cursor: animating ? "default" : "pointer", minHeight: "44px", padding: 0,
            }}
          >
            Replay
          </button>
        )}
      </div>
      <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "0 0 16px", maxWidth: "62ch" }}>
        Anything that needs you rises to the top.
      </p>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", margin: "0 0 16px" }}>
        <ReadNow connected={data.sync.connected} />
        {data.unmatchedSchools > 0 && (
          <span style={{ fontSize: "14px", color: C.orangeText, lineHeight: 1.5, maxWidth: "52ch" }}>
            {data.unmatchedSchools} school{data.unmatchedSchools === 1 ? " is" : "s are"} not on the app
            yet — they are in the traffic light below, not here.
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty unmatched={data.unmatchedSchools} />
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {rows.map((r) => (
            <Row key={r.schoolId} row={r} open={open === r.schoolId} onToggle={() => setOpen(open === r.schoolId ? null : r.schoolId)} />
          ))}
        </div>
      )}
    </div>
  );
}

/** The one sentence the panel exists to say. */
function Hero({ data }: { data: AppActivity }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", backgroundColor: C.blue, borderRadius: R.hero, padding: "34px 32px" }}>
      <span aria-hidden="true" style={{ position: "absolute", top: "-90px", right: "-60px", width: "220px", height: "220px", borderRadius: "50%", backgroundColor: C.orange, opacity: 0.9 }} />
      <span aria-hidden="true" style={{ position: "absolute", bottom: "-28px", right: "128px", width: "90px", height: "90px", borderRadius: "50%", backgroundColor: "#4760C9" }} />
      <div style={{ position: "relative" }}>
        <p style={{ ...bandLabel, color: "#FFD8AE", margin: "0 0 10px" }}>Today on the app</p>
        <p style={{
          fontFamily: "var(--font-outfit)", fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 800,
          letterSpacing: "-0.03em", lineHeight: 1.08, color: C.white, margin: "0 0 10px", maxWidth: "18ch",
        }}>
          {data.flagged === 0
            ? "Nothing needs you today"
            : `${data.flagged} school${data.flagged === 1 ? "" : "s"} need${data.flagged === 1 ? "s" : ""} you today`}
        </p>
        <p style={{ fontSize: "15px", color: data.sync.stale ? "#FFD8AE" : "#C6CFF0", margin: 0, lineHeight: 1.5, maxWidth: "48ch" }}>
          {!data.sync.connected
            ? "The JOC App is not joined up yet, so nothing below has been read from it."
            : data.sync.stale
            ? `${data.sync.text}. Treat every figure below as out of date until it catches up.`
            : data.sync.text}
        </p>
      </div>
    </div>
  );
}

function Empty({ unmatched }: { unmatched: number }) {
  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "32px 24px" }}>
      <p style={{ fontFamily: "var(--font-outfit)", fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 6px" }}>
        No school is on the JOC App yet
      </p>
      <p style={{ fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: "62ch" }}>
        A school appears here once somebody puts its JOC App id on its record. Matching is by id,
        never by name — &ldquo;Yeshiva Darchei Torah&rdquo; and &ldquo;Darchei Torah&rdquo; would
        never have lined up.
        {unmatched > 0 && ` All ${unmatched} schools are waiting for one.`}
      </p>
    </div>
  );
}

function Row({ row, open, onToggle }: { row: AppRow; open: boolean; onToggle: () => void }) {
  const f = row.flag;
  // A waiting message is somebody speaking to us, so its band is blue. Orange
  // is for a thing that has gone wrong on its own.
  const band = !f
    ? { bg: C.panel, fg: C.blue }
    : f.kind === "message"
    ? { bg: C.blue, fg: C.white }
    : { bg: C.orange, fg: C.ink };

  return (
    <div data-school={row.schoolId} style={rowCard}>
      <div style={rowInner}>
        <div style={{
          flex: "1 1 170px", minWidth: 0, padding: "14px 18px",
          backgroundColor: band.bg, color: band.fg,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: "3px",
        }}>
          <span style={{ ...bandLabel, color: band.fg }}>
            {f ? f.label : "Opportunities this week"}
          </span>
          <span style={{ ...bandFigure, color: band.fg }}>
            {f ? f.figure : `${row.stats?.opportunitiesThisWeek ?? 0} taken`}
          </span>
        </div>

        <div style={rowBody}>
          <p style={rowTitle}>
            {row.name}
          </p>
          {f ? (
            <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 10px", lineHeight: 1.5 }}>
              {/* For a waiting message, what they actually asked. */}
              {f.kind === "message" && row.message ? row.message.body : f.reason}
              <span style={{ color: C.orangeText, fontWeight: 600 }}>
                {" · "}true for {f.days === 0 ? "less than a day" : `${f.days} day${f.days === 1 ? "" : "s"}`}
              </span>
            </p>
          ) : !row.stats ? (
            <p style={{ fontSize: "15px", color: C.orangeText, fontWeight: 600, margin: "0 0 10px", lineHeight: 1.5 }}>
              The app has not reported this school yet
            </p>
          ) : (
            <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 10px", lineHeight: 1.5 }}>
              Nothing needs you here.
            </p>
          )}
          <Badges row={row} />
        </div>

        <div style={rowAction}>
          <button type="button" onClick={onToggle} style={f ? primaryButton : secondaryButton}>
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

  // A payment is for a school year, and saying which one is the difference
  // between a fact and a vague reassurance.
  const paid: React.CSSProperties =
    row.payment.state === "paid" || row.payment.state === "granted"
      ? { backgroundColor: C.blueTint, color: C.blue }
      : row.payment.state === "unpaid"
      ? { backgroundColor: C.orange, color: C.ink }
      : { backgroundColor: C.white, color: C.orangeText, boxShadow: `inset 0 0 0 1.5px ${C.orange}` };

  // The panel chip is the ordinary one. Orange text on it is the whole
  // signal: this figure is stale, or the school never opened the thing.
  const plain = { backgroundColor: C.panel, color: C.ink };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      <span style={{ ...chip, ...paid }}>
        {row.payment.state === "unknown" ? row.payment.label : `${row.payment.label} ${schoolYear()}`}
      </span>

      {st?.storeRedeemedThisMonth == null ? (
        <span style={{ ...chip, ...plain, color: C.orangeText }}>Prize store not open</span>
      ) : (
        <span style={{ ...chip, ...plain }}>
          Prize store · {st.storeRedeemedThisMonth} redeemed this month
        </span>
      )}

      {!st ? null : st.unapprovedMinutes === 0 ? (
        <span style={{ ...chip, ...plain }}>All approved</span>
      ) : (
        <span style={{ ...chip, ...plain, color: oldHours ? C.orangeText : C.ink }}>
          {hours(st.unapprovedMinutes)} h to approve
        </span>
      )}
    </div>
  );
}

/** Everything the app knows about one school. Opens under its row. */
function Detail({ row }: { row: AppRow }) {
  const st = row.stats;

  return (
    <div style={rowDetail}>
      {row.message && (
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "16px 18px", marginBottom: "14px" }}>
          <p style={{ ...bandLabel, color: C.blue, margin: "0 0 6px" }}>Waiting on us</p>
          <p style={{ fontSize: "16px", color: C.ink, margin: "0 0 8px", lineHeight: 1.55 }}>{row.message.body}</p>
          <p style={{ fontSize: "13px", color: C.muted, margin: "0 0 10px" }}>
            {row.message.fromName ?? "Somebody at the school"} · {when(row.message.sentAt)}
          </p>
          {/* No reply box, on purpose. */}
          <p style={{ fontSize: "13px", color: C.orangeText, margin: 0, lineHeight: 1.5 }}>
            Replies can&rsquo;t go out to schools until JOC launches. Call instead, then log it.
          </p>
        </div>
      )}

      {!st ? (
        <p style={{ fontSize: "15px", color: C.orangeText, fontWeight: 600, margin: 0 }}>
          The JOC App has not reported this school yet.
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
            {hours(st.minutesThisWeek)} h this week
            <Sub>{hours(st.minutesThisCycle)} h this cycle · {hours(st.minutesThisYear)} h this year</Sub>
          </Cell>

          <Cell label="Waiting for approval">
            {st.unapprovedMinutes === 0 ? (
              "Nothing waiting"
            ) : (
              <>
                {hours(st.unapprovedMinutes)} h
                <Sub>
                  {st.unapprovedEntries} {st.unapprovedEntries === 1 ? "entry" : "entries"} from{" "}
                  {st.unapprovedStudents} {st.unapprovedStudents === 1 ? "student" : "students"}
                  {st.unapprovedOldestAt ? ` · oldest ${when(st.unapprovedOldestAt)}` : ""}
                </Sub>
                <Sub>
                  {st.unapprovedThisWeek} this week · {st.unapprovedOneToTwo} one to two weeks ·{" "}
                  <span style={{ color: st.unapprovedOverTwo > 0 ? C.orangeText : undefined, fontWeight: st.unapprovedOverTwo > 0 ? 600 : undefined }}>
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
                <span aria-hidden="true" style={{ display: "block", height: "6px", borderRadius: R.chip, backgroundColor: C.hairline, overflow: "hidden", marginTop: "7px" }}>
                  <span style={{ display: "block", height: "100%", width: `${Math.min(100, (st.activeStudents / row.enrolment) * 100)}%`, backgroundColor: C.blue }} />
                </span>
              </>
            ) : (
              <>
                {st.activeStudents} active
                <Sub>
                  <Absent>
                    Enrolment not recorded —{" "}
                    <Link href={`/admin/schools/${row.schoolId}`} style={{ color: C.orangeText, fontWeight: 700 }}>
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
                <span key={c.title} style={{ display: "block", fontSize: "15px", marginBottom: "3px" }}>
                  {c.title}{" "}
                  <span style={{ color: C.muted }}>
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
    <div style={{ backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "14px 16px", minWidth: 0 }}>
      <p style={{ ...bandLabel, fontSize: "11px", color: C.muted, margin: "0 0 5px" }}>{label}</p>
      <div style={{ fontSize: "15px", color: C.ink, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

const Sub = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: "block", fontSize: "13px", color: C.muted, marginTop: "3px", lineHeight: 1.5 }}>{children}</span>
);

/** Absence in words — never a dash or a zero standing in for unknown. */
const Absent = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.orangeText, fontWeight: 600 }}>{children}</span>
);

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
    <>
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
        style={{ ...secondaryButton, width: "auto", fontSize: "14px", padding: "11px 18px", minHeight: "44px", cursor: pending ? "wait" : "pointer" }}
      >
        {pending ? "Reading…" : connected ? "Read the app now" : "Test the connection"}
      </button>
      {msg && (
        <span style={{ fontSize: "14px", color: msg.good ? C.greenText : C.orangeText, lineHeight: 1.45, maxWidth: "52ch" }}>
          {msg.text}
        </span>
      )}
    </>
  );
}

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

  const field: React.CSSProperties = {
    fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.ink, backgroundColor: C.white,
    border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "10px 12px",
    minHeight: "44px", width: "100%", boxSizing: "border-box",
  };

  if (done) {
    return <span style={{ fontSize: "13px", fontWeight: 700, color: C.greenText, textAlign: "center" }}>{done}</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.blue,
          background: "none", border: "none", textDecoration: "underline", cursor: "pointer",
          minHeight: "44px", padding: 0,
        }}
      >
        Log a call
      </button>
    );
  }

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {contact && (
        <p style={{ fontSize: "13px", color: C.muted, margin: 0, lineHeight: 1.5 }}>
          {contact.name}
          {contact.phone && (
            <>
              {" · "}
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} style={{ color: C.blue, fontWeight: 700 }}>
                {contact.phone}
              </a>
            </>
          )}
        </p>
      )}
      <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={field}>
        <option>Spoke to contact</option>
        <option>Left a message</option>
        <option>No answer</option>
      </select>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" style={field} />
      <div style={{ display: "flex", gap: "8px" }}>
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
          style={{ ...primaryButton, width: "auto", fontSize: "14px", padding: "10px 16px", minHeight: "44px", cursor: pending ? "wait" : "pointer" }}
        >
          {pending ? "Saving…" : "Log it"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setErr(null); }}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.muted, background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
        >
          Cancel
        </button>
      </div>
      {err && <span style={{ fontSize: "13px", color: C.redText }}>{err}</span>}
      {lastCall && !err && (
        <span style={{ fontSize: "12px", color: C.muted }}>Last called {when(lastCall.at)}</span>
      )}
    </div>
  );
}

/**
 * The flagged schools rising to the top.
 *
 * The list arrives A–Z, the way a list of schools is normally written, and
 * then the ones that need somebody move up. Watching them move is what makes
 * the point: these were in the middle of an ordinary list a second ago.
 *
 * FLIP, so the browser animates a transform rather than reflowing every row.
 * Nothing moves at all where somebody has asked for less motion — the list is
 * simply already sorted, which is the same information without the show.
 */
function useRiseToTop(sorted: AppRow[]) {
  const alpha = [...sorted].sort((a, b) => a.name.localeCompare(b.name));
  const nothingToDo = sorted.every((r) => !r.flag);

  const [order, setOrder] = useState<"alpha" | "sorted">(nothingToDo ? "sorted" : "alpha");
  const [animating, setAnimating] = useState(false);
  const positions = useRef<Map<string, number>>(new Map());

  const measure = () => {
    const m = new Map<string, number>();
    document.querySelectorAll<HTMLElement>("[data-school]").forEach((el) => {
      m.set(el.dataset.school!, el.getBoundingClientRect().top);
    });
    return m;
  };

  const rise = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOrder("sorted");
      return;
    }
    positions.current = measure();
    setAnimating(true);
    setOrder("sorted");
  };

  // Let the first paint land as A–Z, then move.
  useEffect(() => {
    if (nothingToDo) return;
    const t = setTimeout(rise, 450);
    return () => clearTimeout(t);
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Between React writing the new order and the browser painting it, put every
  // row back where it was and let it travel forwards.
  useLayoutEffect(() => {
    if (order !== "sorted" || positions.current.size === 0) return;
    const after = measure();
    let moved = false;
    document.querySelectorAll<HTMLElement>("[data-school]").forEach((el) => {
      const id = el.dataset.school!;
      const from = positions.current.get(id);
      const to = after.get(id);
      if (from === undefined || to === undefined || from === to) return;
      moved = true;
      el.animate(
        [{ transform: `translateY(${from - to}px)` }, { transform: "translateY(0)" }],
        { duration: 900, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    });
    positions.current = new Map();
    if (moved) {
      const t = setTimeout(() => setAnimating(false), 900);
      return () => clearTimeout(t);
    }
    setAnimating(false);
  }, [order]);

  return {
    rows: order === "alpha" ? alpha : [...sorted].sort(compareRows),
    replay: () => { setOrder("alpha"); setTimeout(rise, 60); },
    animating,
  };
}
