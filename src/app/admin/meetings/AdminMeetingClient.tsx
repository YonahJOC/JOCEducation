"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { scheduleMeeting, decideItem, closeMeeting, type Outcome } from "@/app/actions/program-lights";
import { LIGHT_LABEL, LIGHT_COLOR, type Light } from "@/lib/program-lights";
import { sectionHeading, C, R, ROW_SHADOW, CONTENT_MAX, primaryButton, secondaryButton, chip, bandLabel, pageTitle, field, fieldLabel, quietButton, plainChip, note } from "@/lib/joc-tokens";

/**
 * The admin meeting, as a page to work through rather than minutes to write.
 *
 * Items are grouped by program because that is how the meeting runs — one
 * coordinator at a time — and each one ends in a decision that is written
 * back to the light immediately. A decision that lives only in somebody's
 * notes is one the coordinator never sees.
 */

export type MeetingView = {
  id: string;
  meetsAt: Date | string;
  note: string | null;
  closedAt: Date | string | null;
  /** Decided on the server: the meeting things are currently added to. */
  isNext: boolean;
  /** Its date has passed and nobody has closed it. */
  isOverdue: boolean;
  items: {
    id: string;
    schoolId: string;
    schoolName: string;
    programId: number;
    programName: string;
    programSlug: string;
    light: string;
    kind: string;
    note: string;
    by: string | null;
    createdAt: Date | string;
    outcome: string | null;
    outcomeNote: string | null;
    outcomeBy: string | null;
    outcomeAt: Date | string | null;
  }[];
};

const KIND_LABEL: Record<string, string> = {
  REVIEW: "Wants a steer",
  SEND_FOR_REVIEW: "Sent for review",
  SUGGEST_APPEAL: "Appeal suggested",
};

const OUTCOME_LABEL: Record<string, string> = {
  KEEP_LIGHT: "Light kept",
  CHANGE_LIGHT: "Light changed",
  CLOSED: "Closed, nothing changed",
};

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDay = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export function AdminMeetingClient({ meetings }: { meetings: MeetingView[] }) {
  const next = meetings.find((m) => m.isNext);
  const rest = meetings.filter((m) => !m.isNext);

  return (
    <div style={{ maxWidth: CONTENT_MAX }}>
      <h1 style={pageTitle}>
        Admin meeting
      </h1>
      <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "0 0 22px", maxWidth: "66ch" }}>
        Schools the coordinators could not decide about on their own. Each one ends in a decision
        here, and the decision goes straight back to that program&rsquo;s traffic light — so the
        coordinator sees it without anybody having to tell them.
      </p>

      <Book />

      {next ? (
        <Meeting m={next} openByDefault />
      ) : (
        <div style={{ backgroundColor: C.orangeTint, borderRadius: R.row, padding: "20px 22px", margin: "0 0 16px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: C.orangeText, margin: "0 0 4px" }}>
            No meeting is booked
          </p>
          <p style={{ fontSize: "15px", color: C.orangeText, margin: 0, lineHeight: 1.55, maxWidth: "62ch" }}>
            Until one is, a coordinator with an orange or red school has nowhere to send it — the
            console tells them so and blocks the button. Put a date in above.
          </p>
        </div>
      )}

      {rest.length > 0 && (
        <>
          <h2 style={{ ...sectionHeading, color: C.ink, margin: "26px 0 10px" }}>
            Earlier meetings
          </h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {rest.map((m) => <Meeting key={m.id} m={m} />)}
          </div>
        </>
      )}
    </div>
  );
}

function Meeting({ m, openByDefault = false }: { m: MeetingView; openByDefault?: boolean }) {
  const [open, setOpen] = useState(openByDefault);
  const decided = m.items.filter((i) => i.outcome).length;

  // One block per program, in the order the meeting works through them.
  const byProgram = new Map<number, MeetingView["items"]>();
  for (const i of m.items) {
    const list = byProgram.get(i.programId) ?? [];
    list.push(i);
    byProgram.set(i.programId, list);
  }

  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, overflow: "hidden", marginBottom: "14px" }}>
      <div style={{ backgroundColor: C.ink, padding: "18px 22px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ flex: 1, minWidth: "min(100%, 260px)" }}>
          <span style={{ ...bandLabel, color: C.onDarkLabel, display: "block", marginBottom: "3px" }}>
            {m.closedAt ? "Closed" : m.isOverdue ? "Overdue" : m.isNext ? "Next meeting" : "Booked"}
          </span>
          <span style={{ fontFamily: "var(--font-outfit)", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: C.white, display: "block" }}>
            {day(m.meetsAt)}
          </span>
          <span style={{ fontSize: "14px", color: C.onDarkBody, display: "block", marginTop: "3px" }}>
            {m.items.length === 0
              ? "Nothing on it yet"
              : `${m.items.length} school${m.items.length === 1 ? "" : "s"} · ${decided} decided`}
            {m.note && ` · ${m.note}`}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "14px", fontWeight: 700,
            color: C.ink, backgroundColor: C.orange, border: "none",
            borderRadius: R.button, padding: "11px 18px", minHeight: "44px", cursor: "pointer",
          }}
        >
          {open ? "Hide" : "Open"}
        </button>
      </div>

      {open && (
        <div style={{ padding: "18px 22px", backgroundColor: C.paper }}>
          {m.items.length === 0 ? (
            <p style={{ fontSize: "15px", color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: "62ch" }}>
              No coordinator has sent anything to this meeting. They add schools from their own
              program console, under &ldquo;Not in &lt;program&gt; yet&rdquo;.
            </p>
          ) : (
            [...byProgram.entries()].map(([pid, items]) => (
              <div key={pid} style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "baseline", flexWrap: "wrap", marginBottom: "8px" }}>
                  <h3 style={{ fontFamily: "var(--font-outfit)", fontSize: "19px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: 0 }}>
                    {items[0].programName}
                  </h3>
                  <Link href={`/admin/programs/${items[0].programSlug}?tab=schools#not-in-yet`} style={{ fontSize: "15px", fontWeight: 700, color: C.blue, textDecoration: "none" }}>
                    Open its console →
                  </Link>
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  {items.map((i) => <Item key={i.id} item={i} closed={Boolean(m.closedAt)} />)}
                </div>
              </div>
            ))
          )}

          {!m.closedAt && m.items.length > 0 && <Close meetingId={m.id} outstanding={m.items.length - decided} />}
        </div>
      )}
    </div>
  );
}

function Item({ item, closed }: { item: MeetingView["items"][number]; closed: boolean }) {
  const c = LIGHT_COLOR[item.light as Light] ?? LIGHT_COLOR.AMBER;
  const [open, setOpen] = useState(false);

  return (
    <div style={{ backgroundColor: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: "11px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <span aria-hidden="true" style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: c.dot, flexShrink: 0, marginTop: "5px" }} />
        <span style={{ flex: 1, minWidth: "min(100%, 240px)" }}>
          <span style={{ display: "block", fontFamily: "var(--font-outfit)", fontSize: "17px", fontWeight: 700, color: C.ink }}>
            {item.schoolName}
          </span>
          <span style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "5px 0 6px" }}>
            <span style={{ ...chip, backgroundColor: c.tint, color: c.text }}>
              {LIGHT_LABEL[item.light as Light] ?? item.light}
            </span>
            <span style={plainChip}>
              {KIND_LABEL[item.kind] ?? item.kind}
            </span>
          </span>
          <span style={{ display: "block", fontSize: "15px", color: C.ink, lineHeight: 1.55 }}>{item.note}</span>
          <span style={{ display: "block", fontSize: "13px", color: C.muted, marginTop: "4px" }}>
            Added by {item.by ?? "somebody at JOC"} on {shortDay(item.createdAt)}
          </span>
        </span>
      </div>

      {item.outcome ? (
        <div style={{ backgroundColor: C.greenTint, borderRadius: R.form, padding: "11px 13px", marginTop: "10px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: C.greenText, margin: "0 0 3px" }}>
            {OUTCOME_LABEL[item.outcome] ?? item.outcome}
          </p>
          {item.outcomeNote && (
            <p style={{ fontSize: "14px", color: C.greenText, margin: "0 0 3px", lineHeight: 1.5 }}>{item.outcomeNote}</p>
          )}
          <p style={{ fontSize: "13px", color: C.greenText, margin: 0, opacity: 0.8 }}>
            {item.outcomeBy ?? "Somebody at JOC"}
            {item.outcomeAt && ` · ${shortDay(item.outcomeAt)}`}
          </p>
        </div>
      ) : closed ? (
        <p style={{ fontSize: "14px", color: C.orangeText, fontWeight: 600, margin: "10px 0 0" }}>
          The meeting was closed without deciding this one.
        </p>
      ) : open ? (
        <Decide itemId={item.id} current={item.light as Light} onDone={() => setOpen(false)} />
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{ ...secondaryButton, width: "auto", fontSize: "14px", padding: "10px 16px", minHeight: "44px", marginTop: "10px" }}>
          Record what was decided
        </button>
      )}
    </div>
  );
}

function Decide({ itemId, current, onDone }: { itemId: string; current: Light; onDone: () => void }) {
  const [outcome, setOutcome] = useState<Outcome>("KEEP_LIGHT");
  const [light, setLightTo] = useState<Light>(current);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const field: React.CSSProperties = {
    fontFamily: "var(--font-outfit)", fontSize: "15px", color: C.ink, backgroundColor: C.white,
    border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "11px 13px",
    minHeight: "44px", width: "100%", boxSizing: "border-box",
  };
  const label: React.CSSProperties = fieldLabel;

  return (
    <div style={{ display: "grid", gap: "11px", marginTop: "12px", maxWidth: "52ch" }}>
      <div>
        <span style={label}>What was decided</span>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)} style={field}>
          <option value="KEEP_LIGHT">Keep the light as it is</option>
          <option value="CHANGE_LIGHT">Change the light</option>
          <option value="CLOSED">Close it, nothing changes</option>
        </select>
      </div>

      {outcome === "CHANGE_LIGHT" && (
        <div>
          <span style={label}>The new light</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(["GREEN", "AMBER", "RED"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLightTo(l)}
                style={{
                  ...chip, fontSize: "14px", padding: "10px 14px", minHeight: "44px", cursor: "pointer", border: "none",
                  backgroundColor: light === l ? LIGHT_COLOR[l].dot : LIGHT_COLOR[l].tint,
                  color: light === l ? C.white : LIGHT_COLOR[l].text,
                }}
              >
                {LIGHT_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <span style={label}>
          {outcome === "CHANGE_LIGHT" ? "Reason (required)" : "Note (optional)"}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What the coordinator should know"
          style={{ ...field, minHeight: "68px", resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await decideItem(itemId, outcome, note, outcome === "CHANGE_LIGHT" ? light : undefined);
              if (r.ok) onDone();
              else setErr(r.error);
            });
          }}
          style={{ ...primaryButton, width: "auto" }}
        >
          {pending ? "Saving…" : "Record it"}
        </button>
        <button type="button" onClick={onDone} style={quietButton}>
          Cancel
        </button>
      </div>
      {err && <span style={{ fontSize: "14px", color: C.redText }}>{err}</span>}
    </div>
  );
}

function Book() {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ good: boolean; text: string } | null>(null);

  const field: React.CSSProperties = {
    fontFamily: "var(--font-outfit)", fontSize: "15px", color: C.ink, backgroundColor: C.white,
    border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "11px 13px",
    minHeight: "44px", boxSizing: "border-box",
  };

  return (
    <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "18px 20px", marginBottom: "16px" }}>
      <p style={{ ...bandLabel, color: C.muted, margin: "0 0 8px" }}>Book a meeting</p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...field, width: "180px" }} />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          style={{ ...field, flex: 1, minWidth: "min(100%, 220px)" }}
        />
        <button
          type="button"
          disabled={pending || !date}
          onClick={() => {
            setMsg(null);
            start(async () => {
              const r = await scheduleMeeting(date, note);
              setMsg(r.ok ? { good: true, text: r.message } : { good: false, text: r.error });
              if (r.ok) { setDate(""); setNote(""); }
            });
          }}
          style={{ ...primaryButton, width: "auto", opacity: date ? 1 : 0.5 }}
        >
          {pending ? "Booking…" : "Book it"}
        </button>
      </div>
      {msg && (
        <p style={{ fontSize: "14px", color: msg.good ? C.greenText : C.redText, margin: "10px 0 0" }}>{msg.text}</p>
      )}
    </div>
  );
}

function Close({ meetingId, outstanding }: { meetingId: string; outstanding: number }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div style={{ borderTop: `1px solid ${C.hairline}`, paddingTop: "14px", marginTop: "4px" }}>
      {outstanding > 0 && (
        <p style={{ fontSize: "14px", color: C.orangeText, margin: "0 0 8px", lineHeight: 1.5 }}>
          {outstanding} school{outstanding === 1 ? " has" : "s have"} no decision yet. Closing now
          leaves {outstanding === 1 ? "it" : "them"} with the light {outstanding === 1 ? "it" : "they"} came in with.
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setErr(null);
          start(async () => {
            const r = await closeMeeting(meetingId);
            if (!r.ok) setErr(r.error);
          });
        }}
        style={{ ...secondaryButton, width: "auto", fontSize: "14px", padding: "10px 16px", minHeight: "44px" }}
      >
        {pending ? "Closing…" : "Close this meeting"}
      </button>
      {err && <p style={{ fontSize: "14px", color: C.redText, margin: "8px 0 0" }}>{err}</p>}
    </div>
  );
}
