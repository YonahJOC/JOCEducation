"use client";

import { useState, useTransition } from "react";
import { submitReport } from "@/app/actions/ambassadors";
import type { AmbassadorScope, ReportForTeacher } from "@/lib/ambassadors";
import { C, F, R, T, HIT, primaryButton, secondaryButton, chip } from "@/lib/joc-tokens";

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
  /**
   * The form starts closed, always.
   *
   * It used to open itself for anybody who had not written one yet — so a
   * student's first visit was a page of empty fields asking how many
   * people came to a thing that has not happened. A new ambassador should
   * be greeted, not handed a form.
   */
  const [writing, setWriting] = useState(false);
  const [just, setJust] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      {just && (
        <div style={{ backgroundColor: C.greenTint, borderRadius: R.form, padding: "14px 17px" }}>
          <p style={{ ...T.small, color: C.greenText, margin: 0, lineHeight: 1.55 }}>{just}</p>
        </div>
      )}

      <section style={card}>
        <div style={{
          display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", padding: "18px",
        }}>
          <Tile icon="edit_note" bg={C.blueTint} fg={C.blue} />
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <h2 style={{ fontFamily: F.ui, fontSize: "18px", fontWeight: 700, color: C.ink, margin: 0 }}>
              Write up a run
            </h2>
            <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "3px 0 0", lineHeight: 1.5 }}>
              After {scope.programName} runs, tell {scope.supervisor.name ?? "your teacher"} how it went.
              It takes a minute.
            </p>
          </div>
          {!writing && (
            <button
              type="button"
              onClick={() => { setWriting(true); setJust(null); }}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minHeight: HIT, padding: "0 20px", borderRadius: R.button, border: 0, cursor: "pointer",
                background: C.blue, color: C.white,
                fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
              }}
            >
              Start writing
            </button>
          )}
        </div>

        {writing && (
          <div style={{ borderTop: `1px solid ${C.rule}`, padding: "18px" }}>
            <ReportForm
              runs={runs}
              onDone={(m) => { setJust(m); setWriting(false); }}
              onCancel={() => setWriting(false)}
            />
          </div>
        )}
      </section>

      <section style={card}>
        <header style={{ padding: "14px 16px", borderBottom: `1px solid ${C.rule}` }}>
          <h2 style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: 0 }}>
            What you have written
          </h2>
          <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "3px 0 0", lineHeight: 1.5, maxWidth: "54ch" }}>
            {scope.supervisor.name ?? "Your teacher"} reads these. Nobody else at your school sees them,
            and JOC only ever sees the words — never your name.
          </p>
        </header>

        {reports.length === 0 ? (
          <p style={{ ...T.read, color: C.muted, margin: 0, padding: "18px 16px" }}>
            Nothing yet. Write one up after the next time it runs.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {reports.map((r, i) => (
              <li key={r.id} style={{ padding: "15px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.rule}` }}>
                <div style={{ display: "flex", gap: "9px", alignItems: "baseline", flexWrap: "wrap", marginBottom: "7px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink }}>
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
                {/* A student wrote this, so it is set in the reading face. */}
                <p style={{ ...T.read, color: C.ink, margin: 0, whiteSpace: "pre-wrap" }}>
                  {r.whatHappened}
                </p>
                {r.wentWell && (
                  <p style={{ ...T.read, fontSize: "15px", color: C.muted, margin: "7px 0 0" }}>
                    <strong style={{ color: C.ink }}>Went well:</strong> {r.wentWell}
                  </p>
                )}
                {r.wouldChange && (
                  <p style={{ ...T.read, fontSize: "15px", color: C.muted, margin: "5px 0 0" }}>
                    <strong style={{ color: C.ink }}>Would change:</strong> {r.wouldChange}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** White, hairline, 16px, no shadow — the one card in this portal. */
const card: React.CSSProperties = {
  backgroundColor: C.white,
  border: `1px solid ${C.hairline}`,
  borderRadius: R.row,
  overflow: "hidden",
};

/**
 * The coloured square in front of a card's heading.
 *
 * Almost the only colour the portal allows on a page of white cards, and
 * it does a lot of work: it is how somebody scanning tells one card from
 * the next without reading either of them.
 */
export function Tile({ icon, bg, fg }: { icon: string; bg: string; fg: string }) {
  return (
    <span aria-hidden="true" className="material-symbols-rounded" style={{
      width: "48px", height: "48px", flex: "none", borderRadius: R.sm,
      background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
    }}>
      {icon}
    </span>
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
    // No card of its own: it opens inside the one whose heading already
    // says what this is.
    <div style={{ display: "grid", gap: "18px" }}>
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
