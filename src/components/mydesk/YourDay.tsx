"use client";

import { useState, useTransition } from "react";
import { C, F, R, T, HIT } from "@/lib/joc-tokens";
import { Panel, Empty, removeBtn } from "./parts";
import { addDeskEvent, dropDeskEvent } from "@/app/actions/my-desk";
import type { DayItem } from "@/lib/my-desk";

/**
 * Your day — what is actually booked, and nothing aspirational.
 *
 * Two things end up here: events booked with a school, which JOC keeps, and
 * whatever this person puts in themselves. The second was missing, which made
 * this the one quarter of the desk somebody could not act on — a diary you
 * can only read is a diary you keep somewhere else.
 *
 * Today sits at the top with its times in mono, so the column of times reads
 * as a column. The rest of the fortnight is a quieter list underneath.
 */

/** YYYY-MM-DD in the reader's own timezone, not UTC's idea of today. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function YourDay({ day }: { day: DayItem[] }) {
  const now = new Date();
  const todayStr = ymd(now);
  const tomorrowStr = ymd(new Date(now.getTime() + 86400000));

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(todayStr);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const today = day.filter((d) => d.today);
  const rest = day.filter((d) => !d.today);

  function submit() {
    if (pending) return;

    /**
     * Take whichever box they typed in.
     *
     * The note field is the wide one at the bottom, so people put the whole
     * thing in it — "Call Eva Kesselman" — and pressing Enter did nothing at
     * all, silently, because the name above was empty. Refusing to save
     * something a person has clearly written is never the right answer: if
     * there is no name, the note becomes the name.
     */
    const name = title.trim() || note.trim();
    if (!name) {
      setError("Write what it is first.");
      return;
    }
    const detail = title.trim() ? note : "";

    setError(null);
    const payload = { name, when, time, detail };
    start(async () => {
      const res = await addDeskEvent(payload.name, payload.when, payload.time, payload.detail);
      if (res.ok) {
        setTitle(""); setTime(""); setNote(""); setWhen(todayStr); setAdding(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Panel
      title="This week"
      count={today.length ? `${today.length === 1 ? "1 THING" : `${today.length} THINGS`} TODAY` : ""}
      tools={!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            minHeight: HIT, padding: "0 8px", marginLeft: "auto",
            background: "transparent", border: 0, color: C.blue,
            ...T.small, cursor: "pointer",
          }}
        >
          <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "19px" }}>add</span>
          Add
        </button>
      ) : undefined}
    >
      {/* ---- add something of your own ------------------------------- */}
      {adding ? (
        <div style={{
          flex: "0 0 auto", margin: "10px 12px 6px",
          border: `1.5px solid ${C.hairline}`, borderRadius: "12px", background: C.white,
          padding: "12px",
        }}>
          {/* Every field says what it is above itself. With placeholders
              alone, the widest box read as "the one to type in" and people
              put the whole appointment in the note. */}
          <Field label="What is it?">
            <input
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="Call Eva Kesselman"
              aria-label="What is it"
              style={{
                width: "100%", boxSizing: "border-box",
                background: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px", font: `500 15.5px/1.3 ${F.ui}`, color: C.ink, padding: "9px 11px",
              }}
            />
          </Field>

          <Field label="When">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
              <div style={{ display: "flex", background: C.segment, borderRadius: "8px", padding: "2px", gap: "2px" }}>
                {([["Today", todayStr], ["Tomorrow", tomorrowStr]] as const).map(([text, v]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWhen(v)}
                    style={{
                      border: 0, borderRadius: "6px", padding: "6px 10px", cursor: "pointer",
                      background: when === v ? C.white : "transparent",
                      color: when === v ? C.ink : C.faint,
                      font: `${when === v ? 600 : 500} 12.5px/1 ${F.ui}`,
                      boxShadow: when === v ? "0 1px 2px rgba(16,35,63,.08)" : "none",
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                aria-label="Date"
                style={{
                  background: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px",
                  padding: "7px 9px", font: `500 12.5px/1.2 ${F.ui}`, color: C.ink,
                }}
              />
            </div>
          </Field>

          <Field label="Time" hint="leave empty for all day">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Time"
              style={{
                background: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px",
                padding: "7px 9px", font: `500 12.5px/1.2 ${F.ui}`, color: C.ink,
              }}
            />
          </Field>

          <Field label="Who with, or where" hint="optional">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="Her office, or by phone"
              aria-label="Who with, or where"
              style={{
                width: "100%", boxSizing: "border-box",
                background: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px", font: `400 13.5px/1.3 ${F.ui}`, color: C.ink, padding: "8px 11px",
              }}
            />
          </Field>

          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            gap: "6px 8px", marginTop: "12px",
          }}>
            <span style={{
              flex: "1 1 120px",
              font: `500 10px/1.4 ${F.data}`, letterSpacing: ".06em",
              color: error ? C.destructive : C.faint,
            }}>
              {error ?? "ENTER ↵"}
            </span>
            <button
              type="button"
              onClick={() => { setAdding(false); setError(null); }}
              style={{
                background: "transparent", border: 0, color: C.faint,
                font: `500 12.5px/1 ${F.ui}`, cursor: "pointer", padding: "5px 0",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              style={{
                background: C.blue, color: C.white, border: 0, borderRadius: "8px",
                padding: "8px 12px", font: `600 12.5px/1 ${F.ui}`, cursor: "pointer",
              }}
            >
              Add to my day
            </button>
          </div>
        </div>
      ) : null}

      {day.length === 0 ? (
        <Empty line="Nothing booked this week. Add your own meetings above; events you book with a school show up here too." />
      ) : null}

      {today.map((d) => <DayRow key={d.id} d={d} start={start} />)}

      {rest.length ? (
        <>
          <div style={{
            padding: "12px 18px 4px", font: `600 10.5px/1 ${F.data}`,
            letterSpacing: ".1em", color: C.faint,
          }}>
            LATER
          </div>
          {rest.map((d) => <DayRow key={d.id} d={d} start={start} />)}
        </>
      ) : null}
    </Panel>
  );
}

/** The icon beside a row, by what kind of thing it is. */
const KIND_ICON: Record<DayItem["kind"], string> = {
  event: "location_on",
  call: "call",
  meeting: "groups",
  task: "task_alt",
};

/**
 * One line of the week: a date block, what it is, and how to reach it.
 *
 * Today's block is filled blue, so the eye lands on it before reading a word.
 * Everything else is a quiet stack of weekday and number — a calendar's two
 * useful facts, in the order people say them.
 */
function DayRow({ d, start }: { d: DayItem; start: (fn: () => void) => void }) {
  const weekday = d.today
    ? "TODAY"
    : d.when.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

  return (
    <div style={{
      display: "flex", gap: "12px", alignItems: "center",
      padding: "8px 16px", borderTop: `1px solid ${C.rule}`, minHeight: HIT,
    }}>
      <div
        aria-hidden="true"
        style={{
          flex: "0 0 42px", borderRadius: R.sm, padding: "5px 0",
          textAlign: "center",
          background: d.today ? C.blue : C.segment,
          color: d.today ? C.white : C.faint,
        }}
      >
        <div style={{ ...T.meta, color: "inherit", fontSize: "9.5px" }}>{weekday}</div>
        <div style={{
          ...T.body, fontWeight: 700, fontSize: "17px", lineHeight: 1.1,
          color: d.today ? C.white : C.ink,
        }}>
          {d.when.getDate()}
        </div>
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ ...T.body, fontWeight: 600, color: C.ink }}>{d.title}</div>
        <div style={{ ...T.meta, marginTop: "2px" }}>
          {[d.time ?? (d.today ? "ALL DAY" : null), d.meta].filter(Boolean).join(" · ")}
        </div>
      </div>

      <span
        aria-hidden="true"
        className="material-symbols-rounded"
        style={{ color: C.ringQuiet, fontSize: "20px", flex: "0 0 auto" }}
      >
        {KIND_ICON[d.kind]}
      </span>

      {/* Only your own entries can be taken out; a booking with a school is
          the school's record, and it leaves through the school's page. */}
      {d.own ? (
        <button
          type="button"
          aria-label="Remove from your day"
          onClick={() => start(() => { void dropDeskEvent(d.own!); })}
          style={removeBtn}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

/**
 * A labelled field.
 *
 * The form ran on placeholders alone, so the widest box read as the one to
 * type in and the appointment ended up in the note while the name stayed
 * empty — and Enter then did nothing, silently. A label above each field
 * costs four lines and removes the guess.
 */
function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
        <span style={{
          font: `600 10.5px/1 ${F.data}`, letterSpacing: ".08em",
          color: C.faint, textTransform: "uppercase",
        }}>
          {label}
        </span>
        {hint ? (
          <span style={{ font: `400 11px/1 ${F.ui}`, color: C.faint }}>{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
