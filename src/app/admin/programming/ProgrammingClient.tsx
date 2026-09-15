"use client";

import { useState, useTransition } from "react";
import { saveEvent, deleteEvent, cancelEvent } from "@/app/actions/events";
import { PageIntro } from "@/components/admin/PageIntro";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#B8321E";
const RULE = "rgba(16,35,63,.15)";

export type EventRow = {
  id: number;
  kind: "JOC_EVENT" | "SCHOOL_PROGRAM";
  title: string;
  programId: number | null;
  schoolId: string | null;
  /** YYYY-MM-DD, so it drops straight into a date input. */
  startsAt: string;
  endsAt: string;
  location: string;
  audience: string;
  detail: string;
  lead: string;
  status: string;
  published: boolean;
  schoolName: string | null;
  programName: string | null;
};

type Ref = { id: string; name: string };
type ProgramRef = { id: number; name: string };

const STATUSES = ["PLANNED", "CONFIRMED", "DONE", "CANCELLED"] as const;
const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned", CONFIRMED: "Confirmed", DONE: "Done", CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  PLANNED: "#C96C00", CONFIRMED: "#1B7F4B", DONE: "#2D46AF", CANCELLED: "#B8321E",
};

const KIND_LABELS: Record<string, string> = {
  JOC_EVENT: "JOC program",
  SCHOOL_PROGRAM: "Program at a school",
};

const BLANK: EventRow = {
  id: 0, kind: "SCHOOL_PROGRAM", title: "", programId: null, schoolId: null,
  startsAt: "", endsAt: "", location: "", audience: "", detail: "", lead: "",
  status: "PLANNED", published: false, schoolName: null, programName: null,
};

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "14px", color: INK, backgroundColor: "#fff",
  border: `1px solid ${RULE}`, borderRadius: "10px",
  padding: "10px 12px", minHeight: "42px", outline: "none",
};
const label: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "rgba(16,35,63,.6)", marginBottom: "5px",
};
const card: React.CSSProperties = {
  backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)",
  borderRadius: "16px", padding: "20px", marginBottom: "14px",
};

const STEPS = [
  "Press “+ New event”.",
  "Choose which kind it is. A JOC program runs across the whole network — Run for Chesed, a network-wide collection. A program at a school is one program running at one school, and there will be many of those.",
  "Give it a name a school will recognise — “Kindness Booth at Bnos Chaya” rather than “Booth”.",
  "Pick the date. Leave the finish date empty for something that runs on one day.",
  "For a program at a school, choose the school — it cannot be saved without one. A JOC program only needs a school if it happens to be hosted at one.",
  "If it is one of JOC’s programs, link it — the public page then points at that program’s page.",
  "Set the status: Planned while it is pencilled in, Confirmed once the school has agreed.",
  "Tick Published when the school should see it. Until then it is only your working calendar.",
];

export function ProgrammingClient({
  events, schools, programs, disabled,
}: {
  events: EventRow[];
  schools: Ref[];
  programs: ProgramRef[];
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState<EventRow | null>(null);

  if (editing) {
    return (
      <EventForm
        initial={editing}
        schools={schools}
        programs={programs}
        disabled={disabled}
        onDone={() => setEditing(null)}
      />
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => (e.endsAt || e.startsAt) >= today);
  const past = events.filter((e) => (e.endsAt || e.startsAt) < today);
  // Split the way the public page splits them, so what you see here is what a
  // school sees there.
  const jocEvents = upcoming.filter((e) => e.kind === "JOC_EVENT");
  const schoolPrograms = upcoming.filter((e) => e.kind === "SCHOOL_PROGRAM");

  return (
    <div>
      <PageIntro
        title="Programming"
        what="The calendar of what JOC is actually running, and where. This is separate from the Chesed Cycles: the cycles say what every school is learning this month, this says what is happening."
        steps={STEPS}
        note="Nothing appears on the public Programming page until you tick Published. To call something off, use Cancel rather than Delete — a school that was told it was happening needs to see that it is not."
      >
        <button
          onClick={() => setEditing({ ...BLANK })}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "11px 20px",
            minHeight: "44px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          + New event
        </button>
      </PageIntro>

      <Group
        title={`JOC programs — coming up (${jocEvents.length})`}
        events={jocEvents}
        onEdit={setEditing}
        empty="No JOC programs scheduled yet."
      />
      <div style={{ height: "22px" }} />
      <Group
        title={`Programs at schools — coming up (${schoolPrograms.length})`}
        events={schoolPrograms}
        onEdit={setEditing}
        empty="No school programs scheduled yet."
      />
      {past.length > 0 && (
        <>
          <div style={{ height: "22px" }} />
          <Group title={`Already run (${past.length})`} events={past} onEdit={setEditing} empty="" dim />
        </>
      )}
    </div>
  );
}

function Group({
  title, events, onEdit, empty, dim,
}: {
  title: string;
  events: EventRow[];
  onEdit: (e: EventRow) => void;
  empty: string;
  dim?: boolean;
}) {
  return (
    <div>
      <p style={{ fontSize: "10.5px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "rgba(16,35,63,.45)", margin: "0 0 10px" }}>
        {title}
      </p>
      {events.length === 0 ? (
        empty ? (
          <div style={{ backgroundColor: "#fff", border: `1px dashed ${RULE}`, borderRadius: "16px", padding: "32px 22px", textAlign: "center" }}>
            <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.55)", margin: 0 }}>{empty}</p>
          </div>
        ) : null
      ) : (
        <div style={{ backgroundColor: "#fff", border: "1px solid rgba(16,35,63,.09)", borderRadius: "16px", overflow: "hidden", opacity: dim ? 0.75 : 1 }}>
          {events.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
                padding: "14px 18px", borderTop: i === 0 ? "none" : "1px solid rgba(16,35,63,.07)",
              }}
            >
              <span style={{ flex: "0 0 92px", fontSize: "13px", fontWeight: 700, color: INK }}>
                {e.startsAt}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "14.5px", fontWeight: 600, color: INK, margin: 0 }}>
                  {e.title}
                  {!e.published && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#C96C00", backgroundColor: "rgba(250,145,45,.14)", borderRadius: "9999px", padding: "2px 8px", marginLeft: "8px" }}>
                      draft
                    </span>
                  )}
                </p>
                <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", margin: "2px 0 0" }}>
                  {[
                    e.schoolName ?? (e.kind === "JOC_EVENT" ? "Whole network" : "No school set"),
                    e.programName,
                    e.audience,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span style={{
                fontSize: "11.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "9999px",
                color: STATUS_COLORS[e.status], backgroundColor: `${STATUS_COLORS[e.status]}1a`,
              }}>
                {STATUS_LABELS[e.status] ?? e.status}
              </span>
              <button
                onClick={() => onEdit(e)}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventForm({
  initial, schools, programs, disabled, onDone,
}: {
  initial: EventRow;
  schools: Ref[];
  programs: ProgramRef[];
  disabled?: boolean;
  onDone: () => void;
}) {
  const [d, setD] = useState<EventRow>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof EventRow>(k: K, v: EventRow[K]) => setD((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveEvent({
        id: d.id || undefined,
        kind: d.kind,
        title: d.title,
        programId: d.programId,
        schoolId: d.schoolId,
        startsAt: d.startsAt,
        endsAt: d.endsAt || null,
        location: d.location,
        audience: d.audience,
        detail: d.detail,
        lead: d.lead,
        status: d.status,
        published: d.published,
      });
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  function remove() {
    if (!window.confirm(`Delete "${d.title}"? If it was already announced, cancel it instead.`)) return;
    start(async () => {
      const r = await deleteEvent(d.id);
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  function callOff() {
    if (!window.confirm(`Mark "${d.title}" as cancelled? It stays on the calendar, struck through.`)) return;
    start(async () => {
      const r = await cancelEvent(d.id);
      if (r.ok) onDone();
      else setMsg(r.error);
    });
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: "820px" }}>
      <button
        type="button"
        onClick={onDone}
        style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, marginBottom: "12px" }}
      >
        ← All programming
      </button>
      <h1 style={{ fontWeight: 800, fontSize: "24px", letterSpacing: "-0.03em", color: INK, margin: "0 0 20px" }}>
        {d.id ? d.title || "Edit event" : "New event"}
      </h1>

      <div style={card}>
        <p style={{ ...label, marginBottom: "8px" }}>Which kind is this?</p>
        {/* Asked first because it decides the rest of the form: a school
            program has to name its school, a JOC event does not. */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          {(["JOC_EVENT", "SCHOOL_PROGRAM"] as const).map((k) => {
            const on = d.kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => set("kind", k)}
                disabled={disabled}
                style={{
                  fontFamily: "var(--font-outfit)", fontSize: "13.5px", fontWeight: 600,
                  padding: "10px 16px", borderRadius: "10px", minHeight: "44px",
                  cursor: disabled ? "not-allowed" : "pointer", textAlign: "left",
                  border: on ? `1.5px solid ${BLUE}` : `1px solid ${RULE}`,
                  backgroundColor: on ? "rgba(45,70,175,.07)" : "#fff",
                  color: on ? BLUE : "rgba(16,35,63,.7)",
                }}
              >
                {KIND_LABELS[k]}
                <span style={{ display: "block", fontSize: "12px", fontWeight: 400, color: "rgba(16,35,63,.55)", marginTop: "2px" }}>
                  {k === "JOC_EVENT"
                    ? "The whole network, or anyone who wants to come"
                    : "One program, running at one school"}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={label}>What is it called?</label>
          <input
            value={d.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Kindness Booth at Bnos Chaya"
            disabled={disabled}
            style={field}
            autoFocus
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <div>
            <label style={label}>First day</label>
            <input type="date" value={d.startsAt} onChange={(e) => set("startsAt", e.target.value)} disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>Last day</label>
            <input type="date" value={d.endsAt} onChange={(e) => set("endsAt", e.target.value)} disabled={disabled} style={field} />
            <p style={{ fontSize: "12px", color: "rgba(16,35,63,.5)", margin: "5px 0 0" }}>
              Leave empty for a single day.
            </p>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={label}>
              {d.kind === "SCHOOL_PROGRAM" ? "Which school? (required)" : "Hosted at a school?"}
            </label>
            <select
              value={d.schoolId ?? ""}
              onChange={(e) => set("schoolId", e.target.value || null)}
              disabled={disabled}
              style={field}
            >
              <option value="">
                {d.kind === "SCHOOL_PROGRAM" ? "Choose a school…" : "No single school"}
              </option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {schools.length === 0 && (
              <p style={{ fontSize: "12px", color: "#9A5405", margin: "5px 0 0" }}>
                No schools on the system yet. Add one under Schools first.
              </p>
            )}
          </div>
          <div>
            <label style={label}>Which JOC program?</label>
            <select
              value={d.programId ?? ""}
              onChange={(e) => set("programId", e.target.value ? Number(e.target.value) : null)}
              disabled={disabled}
              style={field}
            >
              <option value="">Not one of ours</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p style={{ fontSize: "12px", color: "rgba(16,35,63,.5)", margin: "5px 0 0" }}>
              Links the event to that program&rsquo;s page.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <div>
            <label style={label}>Who is it for?</label>
            <input value={d.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Grades 3–5" disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>Where?</label>
            <input value={d.location} onChange={(e) => set("location", e.target.value)} placeholder="School gym" disabled={disabled} style={field} />
          </div>
          <div>
            <label style={label}>Who at JOC is running it?</label>
            <input value={d.lead} onChange={(e) => set("lead", e.target.value)} placeholder="Dalia" disabled={disabled} style={field} />
          </div>
        </div>
      </div>

      <div style={card}>
        <label style={label}>What is happening?</label>
        <textarea
          value={d.detail}
          onChange={(e) => set("detail", e.target.value)}
          rows={3}
          placeholder="A line or two the school will read on the Programming page."
          disabled={disabled}
          style={{ ...field, resize: "vertical" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "12px" }}>
          <div>
            <label style={label}>Where does it stand?</label>
            <select value={d.status} onChange={(e) => set("status", e.target.value)} disabled={disabled} style={field}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px", color: INK, marginTop: "14px" }}>
          <input
            type="checkbox"
            checked={d.published}
            onChange={(e) => set("published", e.target.checked)}
            disabled={disabled}
            style={{ width: "16px", height: "16px" }}
          />
          Published — schools can see this
        </label>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={disabled || pending}
          style={{
            fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14px", color: "#fff",
            backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "12px 24px",
            minHeight: "44px", cursor: pending ? "wait" : "pointer", opacity: disabled ? 0.5 : 1,
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>

        {d.id > 0 && d.status !== "CANCELLED" && (
          <button
            type="button"
            onClick={callOff}
            disabled={disabled || pending}
            style={{
              fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13.5px", color: "#9A5405",
              backgroundColor: "rgba(250,145,45,.14)", border: "none", borderRadius: "9999px",
              padding: "11px 18px", minHeight: "42px", cursor: "pointer",
            }}
          >
            Cancel this event
          </button>
        )}

        {d.id > 0 && (
          <button
            type="button"
            onClick={remove}
            disabled={disabled || pending}
            style={{
              fontFamily: "var(--font-outfit)", fontSize: "13.5px", color: RED,
              background: "none", border: "none", cursor: "pointer", minHeight: "42px",
            }}
          >
            Delete
          </button>
        )}

        {msg && <p style={{ fontSize: "13.5px", color: RED, margin: 0 }}>{msg}</p>}
      </div>
    </form>
  );
}
