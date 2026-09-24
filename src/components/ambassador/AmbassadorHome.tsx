"use client";

import { useState, useTransition } from "react";
import { submitReport } from "@/app/actions/ambassadors";
import type { AmbassadorScope, ReportForTeacher } from "@/lib/ambassadors";
import { sectionHeading, C, R, ROW_SHADOW, primaryButton, secondaryButton, chip, bandLabel } from "@/lib/joc-tokens";

/**
 * An ambassador's page.
 *
 * One program, the thing they came to write, and their own history. Written
 * for a teenager on a phone between classes: one question at a time, no
 * jargon, and nothing that punishes them for not knowing a number.
 */

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const today = () => new Date().toISOString().slice(0, 10);

export function AmbassadorHome({
  scope, reports, runs,
}: {
  scope: AmbassadorScope;
  reports: ReportForTeacher[];
  runs: { id: number; title: string; startsAt: Date | string }[];
}) {
  const [writing, setWriting] = useState(reports.length === 0);
  const [just, setJust] = useState<string | null>(null);

  return (
    <div>
      <div style={{ position: "relative", overflow: "hidden", backgroundColor: C.blue, borderRadius: R.hero, padding: "30px 26px", marginBottom: "20px" }}>
        <span aria-hidden="true" style={{ position: "absolute", top: "-80px", right: "-50px", width: "190px", height: "190px", borderRadius: "50%", backgroundColor: C.orange, opacity: 0.9 }} />
        <div style={{ position: "relative" }}>
          <p style={{ ...bandLabel, color: C.onDarkLabel, margin: "0 0 8px" }}>You run</p>
          <p style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, color: C.white, margin: "0 0 8px" }}>
            {scope.programName}
          </p>
          <p style={{ fontSize: "15px", color: C.onDarkBody, margin: 0, lineHeight: 1.55 }}>
            At {scope.schoolName} · since {day(scope.startsAt)}
            {scope.endsAt && ` · until ${day(scope.endsAt)}`}
          </p>
        </div>
      </div>

      {just && (
        <div style={{ backgroundColor: C.greenTint, borderRadius: R.form, padding: "14px 17px", marginBottom: "16px" }}>
          <p style={{ fontSize: "15px", color: C.greenText, margin: 0, fontWeight: 600, lineHeight: 1.55 }}>{just}</p>
        </div>
      )}

      {writing ? (
        <ReportForm
          runs={runs}
          onDone={(m) => { setJust(m); setWriting(false); }}
          onCancel={reports.length > 0 ? () => setWriting(false) : undefined}
        />
      ) : (
        <button type="button" onClick={() => { setWriting(true); setJust(null); }} style={{ ...primaryButton, marginBottom: "22px" }}>
          Write up what happened
        </button>
      )}

      <h2 style={{ ...sectionHeading, color: C.ink, margin: "24px 0 4px" }}>
        What you have written
      </h2>
      <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 14px", lineHeight: 1.6, maxWidth: "54ch" }}>
        {scope.supervisor.name ?? "Your teacher"} reads these. Nobody else at your school sees them,
        and JOC only ever sees the words — never your name.
      </p>

      {reports.length === 0 ? (
        <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "24px" }}>
          <p style={{ fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.6 }}>
            Nothing yet. Write one up after the next time it runs.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {reports.map((r) => (
            <div key={r.id} style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "16px 18px" }}>
              <div style={{ display: "flex", gap: "9px", alignItems: "baseline", flexWrap: "wrap", marginBottom: "7px" }}>
                <span style={{ fontFamily: "var(--font-outfit)", fontSize: "18px", fontWeight: 700, color: C.ink }}>
                  {day(r.occurredOn)}
                </span>
                <span style={{ ...chip, backgroundColor: r.seen ? C.greenTint : C.panel, color: r.seen ? C.greenText : C.muted }}>
                  {r.seen ? "Read by your teacher" : "Not read yet"}
                </span>
                {r.participants != null && (
                  <span style={{ ...chip, backgroundColor: C.panel, color: C.ink }}>
                    About {r.participants} students
                  </span>
                )}
              </div>
              <p style={{ fontSize: "15px", color: C.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {r.whatHappened}
              </p>
              {r.wentWell && (
                <p style={{ fontSize: "15px", color: C.muted, margin: "7px 0 0", lineHeight: 1.55 }}>
                  <strong style={{ color: C.ink }}>Went well:</strong> {r.wentWell}
                </p>
              )}
              {r.wouldChange && (
                <p style={{ fontSize: "15px", color: C.muted, margin: "5px 0 0", lineHeight: 1.55 }}>
                  <strong style={{ color: C.ink }}>Would change:</strong> {r.wouldChange}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportForm({
  runs, onDone, onCancel,
}: {
  runs: { id: number; title: string; startsAt: Date | string }[];
  onDone: (message: string) => void;
  onCancel?: () => void;
}) {
  const [occurredOn, setOccurredOn] = useState(today());
  const [eventId, setEventId] = useState<string>("");
  const [participants, setParticipants] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [wentWell, setWentWell] = useState("");
  const [wouldChange, setWouldChange] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const field: React.CSSProperties = {
    fontFamily: "var(--font-outfit)", fontSize: "16px", color: C.ink, backgroundColor: C.white,
    border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "12px 14px",
    minHeight: "48px", width: "100%", boxSizing: "border-box",
  };
  const label: React.CSSProperties = {
    display: "block", fontFamily: "var(--font-outfit)", fontSize: "15px",
    fontWeight: 700, color: C.ink, marginBottom: "6px",
  };
  const hint: React.CSSProperties = {
    display: "block", fontSize: "14px", color: C.muted, marginTop: "5px", lineHeight: 1.5,
  };

  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "22px 20px", display: "grid", gap: "18px" }}>
      <p style={{ fontFamily: "var(--font-outfit)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, margin: 0 }}>
        What happened?
      </p>

      <div>
        <span style={label}>When was it?</span>
        <input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} max={today()} style={field} />
      </div>

      {runs.length > 0 && (
        <div>
          <span style={label}>Was it one of these?</span>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={field}>
            <option value="">Not one of these — something we ran ourselves</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>{r.title} · {day(r.startsAt)}</option>
            ))}
          </select>
          <span style={hint}>
            If it was something you organised yourselves, leave this. That is worth knowing.
          </span>
        </div>
      )}

      <div>
        <span style={label}>Roughly how many students took part?</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder="Leave it blank if you're not sure"
          style={field}
        />
        <span style={hint}>A guess is fine. Everyone who reads it knows it is a guess.</span>
      </div>

      <div>
        <span style={label}>Tell us what happened</span>
        <textarea
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
          rows={5}
          placeholder="What you did, how it went, anything that surprised you"
          style={{ ...field, minHeight: "130px", resize: "vertical", lineHeight: 1.6 }}
        />
        <span style={hint}>
          Please don&rsquo;t put other students&rsquo; names in — write about what happened rather
          than who.
        </span>
      </div>

      <div>
        <span style={label}>What went well? <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></span>
        <textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} rows={2} style={{ ...field, minHeight: "76px", resize: "vertical", lineHeight: 1.6 }} />
      </div>

      <div>
        <span style={label}>What would you change? <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></span>
        <textarea value={wouldChange} onChange={(e) => setWouldChange(e.target.value)} rows={2} style={{ ...field, minHeight: "76px", resize: "vertical", lineHeight: 1.6 }} />
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={pending || !whatHappened.trim()}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await submitReport({
                occurredOn, participants, whatHappened, wentWell, wouldChange,
                eventId: eventId ? Number(eventId) : null,
              });
              if (r.ok) onDone(r.message);
              else setErr(r.error);
            });
          }}
          style={{ ...primaryButton, width: "auto", opacity: whatHappened.trim() ? 1 : 0.5 }}
        >
          {pending ? "Saving…" : "Send it to my teacher"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ ...secondaryButton, width: "auto" }}>
            Cancel
          </button>
        )}
      </div>

      {err && <p role="alert" style={{ fontSize: "15px", color: C.redText, margin: 0, lineHeight: 1.55 }}>{err}</p>}
    </div>
  );
}
