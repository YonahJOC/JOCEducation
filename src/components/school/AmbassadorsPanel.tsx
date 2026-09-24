"use client";

import { useState, useTransition } from "react";
import {
  createInvite, revokeInvite, endTenure, markReportSeen, shareReportPhoto,
} from "@/app/actions/ambassadors";
import type { SupervisedAmbassador, ReportForTeacher } from "@/lib/ambassadors";
import { pageTitle, sectionHeading, C, R, ROW_SHADOW, primaryButton, secondaryButton, chip, bandLabel } from "@/lib/joc-tokens";

/**
 * Your ambassadors, for the teacher who supervises them.
 *
 * The one place a student's name appears anywhere near a report. JOC's own
 * screens get counts and the words, never the child — see src/lib/ambassadors.ts.
 */

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export function AmbassadorsPanel({
  programs, invites, supervised,
}: {
  programs: { id: number; name: string; stage: string }[];
  invites: { id: string; code: string; expiresAt: Date | string; usedCount: number; programId: number; programName: string }[];
  supervised: SupervisedAmbassador[];
}) {
  const current = supervised.filter((a) => a.current);
  const past = supervised.filter((a) => !a.current);
  const unread = current.reduce((n, a) => n + a.reports.filter((r) => !r.seen).length, 0);

  return (
    <div>
      <h1 style={{ ...pageTitle, color: C.ink, margin: "0 0 6px" }}>
        Your ambassadors
      </h1>
      <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "0 0 8px", maxWidth: "64ch" }}>
        Two students per program run it on the ground and write up what happened each time. You hand
        them a code, you read what they write, and nothing they write leaves this page with their
        name on it.
      </p>
      <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.6, margin: "0 0 22px", maxWidth: "64ch" }}>
        Give the code to the student yourself — say it, or write it down. JOC never emails a student.
      </p>

      {unread > 0 && (
        <div style={{ backgroundColor: C.blueTint, borderRadius: R.form, padding: "13px 16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "15px", color: C.blue, margin: 0, fontWeight: 600 }}>
            {unread} report{unread === 1 ? "" : "s"} you have not read yet.
          </p>
        </div>
      )}

      <MakeCode programs={programs} taken={current} />

      {invites.length > 0 && (
        <div style={{ marginBottom: "22px" }}>
          <p style={{ ...bandLabel, color: C.muted, margin: "0 0 8px" }}>Codes waiting to be used</p>
          <div style={{ display: "grid", gap: "10px" }}>
            {invites.map((i) => <Invite key={i.id} invite={i} />)}
          </div>
        </div>
      )}

      <h2 style={{ ...sectionHeading, color: C.ink, margin: "0 0 12px" }}>
        {current.length === 0 ? "Nobody yet" : `${current.length} ambassador${current.length === 1 ? "" : "s"}`}
      </h2>

      {current.length === 0 ? (
        <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "28px 24px" }}>
          <p style={{ fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: "58ch" }}>
            No student has joined yet. Make a code above, give it to the two students who run the
            program, and they enter it at <strong style={{ color: C.ink }}>/ambassador/join</strong>{" "}
            once they have signed in.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {current.map((a) => <Ambassador key={a.id} a={a} />)}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 style={{ ...sectionHeading, color: C.ink, margin: "26px 0 10px" }}>
            Finished
          </h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {past.map((a) => <Ambassador key={a.id} a={a} />)}
          </div>
        </>
      )}
    </div>
  );
}

function MakeCode({
  programs, taken,
}: {
  programs: { id: number; name: string; stage: string }[];
  taken: SupervisedAmbassador[];
}) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? 0);
  const [pending, start] = useTransition();
  const [made, setMade] = useState<{ code: string; expiresOn: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (programs.length === 0) {
    return (
      <div style={{ backgroundColor: C.orangeTint, borderRadius: R.form, padding: "16px 18px", marginBottom: "22px" }}>
        <p style={{ fontSize: "15px", color: C.orangeText, margin: 0, lineHeight: 1.6, maxWidth: "58ch" }}>
          Your school is not down as running any JOC program yet, so there is nothing for an
          ambassador to run. That will fill in as JOC records your programs.
        </p>
      </div>
    );
  }

  const here = taken.filter((a) => a.programId === programId).length;

  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "18px 20px", marginBottom: "22px" }}>
      <p style={{ ...bandLabel, color: C.muted, margin: "0 0 10px" }}>Give a student a place</p>

      {made ? (
        <div>
          <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 8px" }}>
            Read this out to the student. It works until {made.expiresOn}.
          </p>
          <p style={{
            fontFamily: "var(--font-outfit)", fontSize: "40px", fontWeight: 800,
            letterSpacing: "0.04em", color: C.blue, margin: "0 0 12px",
          }}>
            {made.code}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(made.code).then(
                  () => setCopied(true),
                  () => setCopied(false),
                );
              }}
              style={{ ...secondaryButton, width: "auto", fontSize: "14px", padding: "10px 16px", minHeight: "44px" }}
            >
              {copied ? "Copied" : "Copy it"}
            </button>
            <button
              type="button"
              onClick={() => { setMade(null); setCopied(false); }}
              style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", color: C.muted, background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
            >
              Make another
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={programId}
            onChange={(e) => setProgramId(Number(e.target.value))}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "15px", color: C.ink, backgroundColor: C.white,
              border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "11px 13px",
              minHeight: "44px", flex: 1, minWidth: "min(100%, 240px)", boxSizing: "border-box",
            }}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || here >= 2}
            onClick={() => {
              setErr(null);
              start(async () => {
                const r = await createInvite(programId);
                if (r.ok) setMade({ code: r.code, expiresOn: r.expiresOn });
                else setErr(r.error);
              });
            }}
            style={{ ...primaryButton, width: "auto", opacity: here >= 2 ? 0.5 : 1 }}
          >
            {pending ? "Making…" : "Make a code"}
          </button>
          <span style={{ fontSize: "14px", color: here >= 2 ? C.orangeText : C.muted, lineHeight: 1.5 }}>
            {here >= 2
              ? "Both places are taken on this one."
              : `${2 - here} place${2 - here === 1 ? "" : "s"} left on this one.`}
          </span>
        </div>
      )}
      {err && <p style={{ fontSize: "14px", color: C.redText, margin: "10px 0 0" }}>{err}</p>}
    </div>
  );
}

function Invite({
  invite,
}: {
  invite: { id: string; code: string; expiresAt: Date | string; usedCount: number; programName: string };
}) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;

  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.form, boxShadow: ROW_SHADOW, padding: "13px 16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--font-outfit)", fontSize: "20px", fontWeight: 800, letterSpacing: "0.12em", color: C.blue }}>
        {invite.code}
      </span>
      <span style={{ flex: 1, minWidth: "min(100%, 200px)", fontSize: "14px", color: C.muted, lineHeight: 1.5 }}>
        {invite.programName} · until {day(invite.expiresAt)}
        {invite.usedCount > 0 && ` · used ${invite.usedCount}×`}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { const r = await revokeInvite(invite.id); if (r.ok) setGone(true); })}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.orangeText, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", minHeight: "44px" }}
      >
        {pending ? "Cancelling…" : "Cancel it"}
      </button>
    </div>
  );
}

function Ambassador({ a }: { a: SupervisedAmbassador }) {
  const [open, setOpen] = useState(a.reports.some((r) => !r.seen));
  const [ended, setEnded] = useState(false);
  const [pending, start] = useTransition();
  const unread = a.reports.filter((r) => !r.seen).length;

  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", padding: "16px 18px" }}>
        <span style={{ flex: 1, minWidth: "min(100%, 240px)" }}>
          <span style={{ display: "block", fontFamily: "var(--font-outfit)", fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink }}>
            {a.studentName ?? a.studentEmail}
          </span>
          <span style={{ display: "block", fontSize: "15px", color: C.muted, marginTop: "3px", lineHeight: 1.5 }}>
            {a.programName} · since {day(a.startsAt)}
            {!a.current && a.endsAt && ` · finished ${day(a.endsAt)}`}
          </span>
          <span style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "7px" }}>
            <span style={{ ...chip, backgroundColor: C.panel, color: a.reports.length ? C.ink : C.orangeText }}>
              {a.reports.length === 0
                ? "Nothing written up yet"
                : `${a.reports.length} report${a.reports.length === 1 ? "" : "s"}`}
            </span>
            {unread > 0 && (
              <span style={{ ...chip, backgroundColor: C.blueTint, color: C.blue }}>{unread} unread</span>
            )}
          </span>
        </span>
        {a.reports.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            style={{ ...(open ? secondaryButton : primaryButton), width: "auto" }}
          >
            {open ? "Close" : "Read them"}
          </button>
        )}
      </div>

      {open && a.reports.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.hairline}`, backgroundColor: C.paper, padding: "16px 18px", display: "grid", gap: "12px" }}>
          {a.reports.map((r) => <Report key={r.id} r={r} />)}
        </div>
      )}

      {a.current && !ended && (
        <div style={{ borderTop: `1px solid ${C.hairline}`, padding: "11px 18px" }}>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => { const r = await endTenure(a.id); if (r.ok) setEnded(true); })}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", color: C.muted, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", minHeight: "44px", padding: 0 }}
          >
            {pending ? "Ending…" : "They have finished running it"}
          </button>
        </div>
      )}
      {ended && (
        <p style={{ borderTop: `1px solid ${C.hairline}`, fontSize: "14px", color: C.greenText, fontWeight: 600, margin: 0, padding: "12px 18px" }}>
          Ended. Their place is free for somebody else.
        </p>
      )}
    </div>
  );
}

function Report({ r }: { r: ReportForTeacher }) {
  const [seen, setSeen] = useState(r.seen);
  const [shared, setShared] = useState(r.photoShared);
  const [, start] = useTransition();

  return (
    <div style={{ backgroundColor: C.white, border: `1px solid ${seen ? C.hairline : C.blue}`, borderRadius: R.form, padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "baseline", flexWrap: "wrap", marginBottom: "8px" }}>
        <span style={{ fontFamily: "var(--font-outfit)", fontSize: "17px", fontWeight: 700, color: C.ink }}>
          {day(r.occurredOn)}
        </span>
        {r.eventTitle && (
          <span style={{ ...chip, backgroundColor: C.panel, color: C.ink }}>{r.eventTitle}</span>
        )}
        <span style={{ ...chip, backgroundColor: C.panel, color: r.participants == null ? C.orangeText : C.ink }}>
          {r.participants == null
            ? "No number given"
            : `About ${r.participants} students — their estimate`}
        </span>
        {!seen && <span style={{ ...chip, backgroundColor: C.blueTint, color: C.blue }}>New</span>}
      </div>

      <p style={{ fontSize: "15px", color: C.ink, margin: "0 0 8px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {r.whatHappened}
      </p>
      {r.wentWell && (
        <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 6px", lineHeight: 1.55 }}>
          <strong style={{ color: C.ink }}>Went well:</strong> {r.wentWell}
        </p>
      )}
      {r.wouldChange && (
        <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 6px", lineHeight: 1.55 }}>
          <strong style={{ color: C.ink }}>Would change:</strong> {r.wouldChange}
        </p>
      )}

      {r.photoId && (
        <label style={{ display: "flex", gap: "9px", alignItems: "flex-start", fontSize: "14px", color: C.muted, lineHeight: 1.5, cursor: "pointer", marginTop: "10px" }}>
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => {
              const next = e.target.checked;
              setShared(next);
              start(async () => { await shareReportPhoto(r.id, next); });
            }}
            style={{ marginTop: "3px", width: "18px", height: "18px" }}
          />
          <span>
            Let JOC see the photo. Off by default — a photo of your event has other people&rsquo;s
            children in it, and that is your call, not theirs.
          </span>
        </label>
      )}

      {!seen && (
        <button
          type="button"
          onClick={() => { setSeen(true); start(async () => { await markReportSeen(r.id); }); }}
          style={{ ...secondaryButton, width: "auto", fontSize: "14px", padding: "9px 14px", minHeight: "44px", marginTop: "10px" }}
        >
          Mark as read
        </button>
      )}
    </div>
  );
}
