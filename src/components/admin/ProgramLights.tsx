"use client";

import { useState, useTransition } from "react";
import {
  reachOut, sendToMeeting, setLight, refreshLights, dismissExpiry,
  type Channel, type AgendaKind,
} from "@/app/actions/program-lights";
import { LIGHT_LABEL, LIGHT_MEANING, LIGHT_COLOR, type Light } from "@/lib/program-lights";
import { C, R, ROW_SHADOW, CONTENT_MAX, primaryButton, secondaryButton, chip, bandLabel } from "@/lib/joc-tokens";
import type { ProgramTraffic, TrafficRow } from "@/lib/program-traffic";

/**
 * "Not in <Program> yet" — the traffic light.
 *
 * Every school this program has not reached, and whether its coordinator may
 * pick up the phone. Eight coordinators working eight programs off eight
 * private lists is how one principal gets rung three times in a week, and
 * decides JOC does not talk to itself.
 *
 * Green is the only light with a button that finishes the job here. Orange
 * and red both end at the same place — the next admin meeting — because the
 * whole point of them is that this is not one coordinator's decision.
 */

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
const dayYear = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

type Filter = "all" | Light;

export function ProgramLights({
  programId, slug, programName, data,
}: {
  programId: number;
  slug: string;
  programName: string;
  data: ProgramTraffic;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = filter === "all" ? data.rows : data.rows.filter((r) => r.light === filter);

  return (
    <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto 16px" }} id="not-in-yet">
      <h2 style={{ fontFamily: "var(--font-outfit)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "24px 0 2px" }}>
        Not in {programName} yet
      </h2>
      <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "0 0 14px", maxWidth: "64ch" }}>
        Every school this program has not reached. The light says whether to approach them — it is
        worked out overnight from what the rest of JOC is already doing with that school.
      </p>

      <Expiries expired={data.expired} slug={slug} />

      {!data.everComputed && (
        <Note tone="warn">
          The lights have not been worked out yet. Until somebody runs them, treat every school here
          as a discuss-first.
          {data.canSetLight && " Run them now with the button below."}
        </Note>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", margin: "0 0 14px" }}>
        <Chip on={filter === "all"} onClick={() => setFilter("all")}>All · {data.counts.all}</Chip>
        {(["GREEN", "AMBER", "RED"] as const).map((l) => (
          <Chip key={l} on={filter === l} onClick={() => setFilter(l)} light={l}>
            {LIGHT_LABEL[l]} · {data.counts[l]}
          </Chip>
        ))}
        {data.canSetLight && <RunRules slug={slug} />}
      </div>

      {rows.length === 0 ? (
        <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "28px 24px" }}>
          <p style={{ fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: "62ch" }}>
            {data.counts.all === 0
              ? `Every school on the system is already in ${programName}.`
              : `No school is on ${LIGHT_LABEL[filter as Light].toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {rows.map((r) => (
            <LightRow
              key={r.schoolId}
              row={r}
              programId={programId}
              slug={slug}
              canSetLight={data.canSetLight}
              meetingBooked={Boolean(data.meeting)}
            />
          ))}
        </div>
      )}

      <NextMeeting data={data} programName={programName} />
    </div>
  );
}

// ─── One school ──────────────────────────────────────────────────────────────

function LightRow({
  row, programId, slug, canSetLight, meetingBooked,
}: {
  row: TrafficRow;
  programId: number;
  slug: string;
  canSetLight: boolean;
  meetingBooked: boolean;
}) {
  const c = LIGHT_COLOR[row.light];
  const [open, setOpen] = useState<"act" | "light" | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const already =
    row.done?.kind === "reached"
      ? `Reached out at ${new Date(row.done.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${row.done.channel} · notes saved to the school's activity log`
      : row.done?.kind === "agenda"
      ? `On the agenda for ${day(row.done.meetsAt)}`
      : null;

  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
        <div style={{
          flex: "1 1 200px", minWidth: 0, padding: "14px 18px", backgroundColor: c.tint,
          display: "flex", gap: "12px", alignItems: "center",
        }}>
          <Housing light={row.light} />
          <span style={{ fontFamily: "var(--font-outfit)", fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: c.text, lineHeight: 1.15 }}>
            {LIGHT_LABEL[row.light]}
          </span>
        </div>

        <div style={{ flex: "100 1 280px", minWidth: 0, padding: "16px 18px" }}>
          <p style={{ fontFamily: "var(--font-outfit)", fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 4px" }}>
            {row.name}
            {row.place && (
              <span style={{ fontSize: "15px", fontWeight: 400, color: C.muted }}> · {row.place}</span>
            )}
          </p>
          <p style={{ fontSize: "15px", color: C.muted, margin: "0 0 6px", lineHeight: 1.5 }}>
            {row.reason}
          </p>
          <p style={{ fontSize: "13px", color: C.muted, margin: 0, lineHeight: 1.5 }}>
            {row.source.kind === "rule" ? (
              <>From the rules · {LIGHT_MEANING[row.light].toLowerCase()}</>
            ) : (
              <>
                Set by {row.source.by} on {dayYear(row.source.on)}
                {row.source.until ? (
                  <span style={{ color: C.orangeText, fontWeight: 600 }}> · until {dayYear(row.source.until)}</span>
                ) : (
                  " · no end date"
                )}
              </>
            )}
          </p>
        </div>

        <div style={{ flex: "1 1 210px", minWidth: 0, padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
          {done || already ? (
            <span style={{ fontSize: "13px", fontWeight: 600, color: C.greenText, lineHeight: 1.5 }}>
              {done ?? already}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(open === "act" ? null : "act")}
              style={
                row.light === "GREEN"
                  ? { ...primaryButton, backgroundColor: c.dot, border: `2px solid ${c.dot}` }
                  : { ...secondaryButton, color: c.text, border: `2px solid ${c.dot}` }
              }
            >
              {open === "act"
                ? "Close"
                : row.light === "GREEN"
                ? "Reach out"
                : row.light === "AMBER"
                ? "Let's review"
                : "Send to review"}
            </button>
          )}
          {canSetLight && (
            <button
              type="button"
              onClick={() => setOpen(open === "light" ? null : "light")}
              style={{
                fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.blue,
                background: "none", border: "none", textDecoration: "underline", cursor: "pointer",
                minHeight: "44px", padding: 0,
              }}
            >
              {open === "light" ? "Cancel" : "Change light"}
            </button>
          )}
        </div>
      </div>

      {open === "act" && !done && !already && (
        <div style={{ borderTop: `1px solid ${C.hairline}`, backgroundColor: C.paper, padding: "18px" }}>
          {row.light === "GREEN" ? (
            <ReachOutForm
              programId={programId}
              slug={slug}
              schoolId={row.schoolId}
              onDone={(m) => { setDone(m); setOpen(null); }}
            />
          ) : (
            <AgendaForm
              light={row.light}
              programId={programId}
              slug={slug}
              schoolId={row.schoolId}
              meetingBooked={meetingBooked}
              onDone={(m) => { setDone(m); setOpen(null); }}
            />
          )}
        </div>
      )}

      {open === "light" && (
        <div style={{ borderTop: `1px solid ${C.hairline}`, backgroundColor: C.paper, padding: "18px" }}>
          <ChangeLightForm
            programId={programId}
            slug={slug}
            schoolId={row.schoolId}
            current={row.light}
            onDone={() => setOpen(null)}
          />
        </div>
      )}
    </div>
  );
}

/** Three dots in a dark housing. The one that is on is the only lit one. */
function Housing({ light }: { light: Light }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex", flexDirection: "column", gap: "4px", flexShrink: 0,
        backgroundColor: C.ink, borderRadius: "10px", padding: "6px",
      }}
    >
      {(["RED", "AMBER", "GREEN"] as const).map((l) => (
        <span
          key={l}
          style={{
            width: "14px", height: "14px", borderRadius: "50%",
            backgroundColor: l === light ? LIGHT_COLOR[l].dot : "rgba(255,255,255,.18)",
          }}
        />
      ))}
    </span>
  );
}

// ─── The three forms ─────────────────────────────────────────────────────────

const field: React.CSSProperties = {
  fontFamily: "var(--font-outfit)", fontSize: "15px", color: C.ink, backgroundColor: C.white,
  border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "11px 13px",
  minHeight: "44px", width: "100%", boxSizing: "border-box",
};

const label: React.CSSProperties = { ...bandLabel, fontSize: "11px", color: C.muted, display: "block", marginBottom: "5px" };

function ReachOutForm({
  programId, slug, schoolId, onDone,
}: {
  programId: number; slug: string; schoolId: string; onDone: (m: string) => void;
}) {
  const [channel, setChannel] = useState<Channel>("CALL");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: "12px", maxWidth: "56ch" }}>
      <p style={{ fontSize: "14px", color: C.muted, margin: 0, lineHeight: 1.55 }}>
        This records what you did after you did it. Nothing here is sent to the school.
      </p>
      <div>
        <span style={label}>How you reached out</span>
        <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} style={field}>
          <option value="CALL">Call</option>
          <option value="EMAIL">Email</option>
          <option value="VISIT">In person</option>
        </select>
      </div>
      <div>
        <span style={label}>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Who you spoke to and where it got to"
          style={{ ...field, minHeight: "84px", resize: "vertical" }}
        />
      </div>
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await reachOut(programId, slug, schoolId, channel, notes);
              if (r.ok) onDone(r.message);
              else setErr(r.error);
            });
          }}
          style={{ ...primaryButton, width: "auto" }}
        >
          {pending ? "Saving…" : "Save to the school's log"}
        </button>
      </div>
      {err && <span style={{ fontSize: "14px", color: C.redText }}>{err}</span>}
    </div>
  );
}

function AgendaForm({
  light, programId, slug, schoolId, meetingBooked, onDone,
}: {
  light: Light; programId: number; slug: string; schoolId: string;
  meetingBooked: boolean; onDone: (m: string) => void;
}) {
  const [kind, setKind] = useState<AgendaKind>(light === "AMBER" ? "REVIEW" : "SEND_FOR_REVIEW");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  if (!meetingBooked) {
    return (
      <Note tone="warn">
        No admin meeting is booked, so there is nowhere to send this. Ask whoever runs the meeting to
        put a date in, then come back — nothing is lost by waiting.
      </Note>
    );
  }

  return (
    <div style={{ display: "grid", gap: "12px", maxWidth: "56ch" }}>
      {light === "RED" && (
        <div>
          <span style={label}>What you are asking for</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as AgendaKind)} style={field}>
            <option value="SEND_FOR_REVIEW">Send for review</option>
            <option value="SUGGEST_APPEAL">Suggest an appeal</option>
          </select>
        </div>
      )}
      <div>
        <span style={label}>
          {light === "RED" ? "Comments (required)" : "What you want discussed"}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={light === "RED" ? "Why this should be looked at again" : "What you need a steer on"}
          style={{ ...field, minHeight: "84px", resize: "vertical" }}
        />
      </div>
      <p style={{ fontSize: "13px", color: C.muted, margin: 0, lineHeight: 1.55 }}>
        {light === "RED"
          ? "The light stays on hold off until the admins change it."
          : "It goes on the next admin meeting. Nothing reaches the school."}
      </p>
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await sendToMeeting(programId, slug, schoolId, kind, note);
              if (r.ok) onDone(r.message);
              else setErr(r.error);
            });
          }}
          style={{ ...primaryButton, width: "auto" }}
        >
          {pending ? "Adding…" : "Add to the next meeting"}
        </button>
      </div>
      {err && <span style={{ fontSize: "14px", color: C.redText }}>{err}</span>}
    </div>
  );
}

function ChangeLightForm({
  programId, slug, schoolId, current, onDone,
}: {
  programId: number; slug: string; schoolId: string; current: Light; onDone: () => void;
}) {
  const [light, setL] = useState<Light>(current);
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const [all, setAll] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: "12px", maxWidth: "56ch" }}>
      <div>
        <span style={label}>The light</span>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["GREEN", "AMBER", "RED"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setL(l)}
              style={{
                ...chip, fontSize: "14px", padding: "10px 14px", minHeight: "44px", cursor: "pointer",
                backgroundColor: light === l ? LIGHT_COLOR[l].dot : LIGHT_COLOR[l].tint,
                color: light === l ? C.white : LIGHT_COLOR[l].text,
                border: "none",
              }}
            >
              {LIGHT_LABEL[l]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span style={label}>Why (required)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="A light with no reason cannot be argued with later"
          style={{ ...field, minHeight: "68px", resize: "vertical" }}
        />
      </div>
      <div>
        <span style={label}>Until (optional)</span>
        <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} style={field} />
        <span style={{ fontSize: "13px", color: C.muted, display: "block", marginTop: "5px", lineHeight: 1.5 }}>
          Leave this empty and it stays until somebody changes it. With a date, the rules take the
          school back afterwards and you are told here.
        </span>
      </div>
      {light === "RED" && (
        <label style={{ display: "flex", gap: "9px", alignItems: "flex-start", fontSize: "15px", color: C.ink, lineHeight: 1.5, cursor: "pointer" }}>
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} style={{ marginTop: "4px", width: "18px", height: "18px" }} />
          <span>Hold off on this school for <strong>every</strong> program, not just this one.</span>
        </label>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await setLight(programId, slug, schoolId, light, reason, {
                until: until || null,
                allPrograms: light === "RED" && all,
              });
              if (r.ok) onDone();
              else setErr(r.error);
            });
          }}
          style={{ ...primaryButton, width: "auto" }}
        >
          {pending ? "Saving…" : "Set the light"}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "15px", color: C.muted, background: "none", border: "none", cursor: "pointer", minHeight: "44px" }}
        >
          Cancel
        </button>
      </div>
      {err && <span style={{ fontSize: "14px", color: C.redText }}>{err}</span>}
    </div>
  );
}

// ─── The rest of the section ─────────────────────────────────────────────────

function NextMeeting({ data, programName }: { data: ProgramTraffic; programName: string }) {
  if (!data.meeting) {
    return (
      <Note tone="warn">
        No admin meeting is booked. Until one is, an orange or a red school has nowhere to go — put a
        date in on the meeting page.
      </Note>
    );
  }

  const m = data.meeting;
  return (
    <div style={{ backgroundColor: C.ink, borderRadius: R.row, padding: "20px 22px", marginTop: "14px" }}>
      <p style={{ ...bandLabel, color: "#FFD8AE", margin: "0 0 4px" }}>Next admin meeting</p>
      <p style={{ fontFamily: "var(--font-outfit)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: C.white, margin: "0 0 10px" }}>
        {day(m.meetsAt)}
      </p>

      {m.items.length === 0 ? (
        <p style={{ fontSize: "15px", color: "#C6CFF0", margin: 0, lineHeight: 1.55, maxWidth: "62ch" }}>
          Nothing from {programName} is on it yet.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {m.items.map((i) => (
            <div key={i.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", backgroundColor: "rgba(255,255,255,.06)", borderRadius: R.form, padding: "11px 13px" }}>
              <span aria-hidden="true" style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: LIGHT_COLOR[i.light].dot, flexShrink: 0, marginTop: "4px" }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: "15px", fontWeight: 700, color: C.white }}>
                  {i.schoolName} <span style={{ fontWeight: 400, color: "#C6CFF0" }}>· {i.kind}</span>
                </span>
                <span style={{ display: "block", fontSize: "14px", color: "#C6CFF0", lineHeight: 1.5, marginTop: "2px" }}>
                  {i.note}
                </span>
                <span style={{ display: "block", fontSize: "12.5px", color: "rgba(255,255,255,.5)", marginTop: "3px" }}>
                  Added by {i.by ?? "somebody at JOC"}
                  {i.outcome && ` · ${i.outcome}`}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Expiries({ expired, slug }: { expired: ProgramTraffic["expired"]; slug: string }) {
  const [gone, setGone] = useState<string[]>([]);
  const [, start] = useTransition();
  const left = expired.filter((e) => !gone.includes(e.lightId));
  if (left.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: "8px", margin: "0 0 14px" }}>
      {left.map((e) => (
        <div key={e.lightId} style={{ backgroundColor: C.orangeTint, borderRadius: R.form, padding: "13px 16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "15px", color: C.orangeText, lineHeight: 1.5, flex: 1, minWidth: "min(100%, 300px)" }}>
            The <strong>{LIGHT_LABEL[e.light].toLowerCase()}</strong> you put on{" "}
            <strong>{e.schoolName}</strong> has run out. It is back on the rules.
          </span>
          <button
            type="button"
            onClick={() => start(async () => { await dismissExpiry(e.lightId, slug); setGone((g) => [...g, e.lightId]); })}
            style={{ fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.orangeText, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", minHeight: "44px" }}
          >
            Got it
          </button>
        </div>
      ))}
    </div>
  );
}

function RunRules({ slug }: { slug: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await refreshLights(slug);
            setMsg(r.ok ? r.message : r.error);
          });
        }}
        style={{
          fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700, color: C.blue,
          background: "none", border: "none", textDecoration: "underline", cursor: "pointer",
          minHeight: "44px", padding: "0 4px",
        }}
      >
        {pending ? "Running…" : "Run the rules now"}
      </button>
      {msg && <span style={{ fontSize: "13.5px", color: C.muted, lineHeight: 1.45 }}>{msg}</span>}
    </>
  );
}

function Chip({
  on, onClick, light, children,
}: {
  on: boolean; onClick: () => void; light?: Light; children: React.ReactNode;
}) {
  const c = light ? LIGHT_COLOR[light] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...chip, fontSize: "14px", padding: "10px 15px", minHeight: "44px", cursor: "pointer", border: "none",
        backgroundColor: on ? C.ink : c ? c.tint : C.panel,
        color: on ? C.white : c ? c.text : C.ink,
      }}
    >
      {children}
    </button>
  );
}

function Note({ tone, children }: { tone: "warn" | "info"; children: React.ReactNode }) {
  const warn = tone === "warn";
  return (
    <div style={{ backgroundColor: warn ? C.orangeTint : C.panel, borderRadius: R.form, padding: "13px 16px", margin: "0 0 14px" }}>
      <p style={{ fontSize: "15px", color: warn ? C.orangeText : C.muted, margin: 0, lineHeight: 1.55, maxWidth: "70ch" }}>
        {children}
      </p>
    </div>
  );
}
