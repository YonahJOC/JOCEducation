"use client";

import { useState, useTransition } from "react";
import { C, F } from "@/lib/joc-tokens";
import { Panel, Empty, Meta, QUIET, FAINT, SOFT, RULE } from "./parts";
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
    if (!title.trim() || pending) return;
    setError(null);
    const payload = { title, when, time, note };
    start(async () => {
      const res = await addDeskEvent(payload.title, payload.when, payload.time, payload.note);
      if (res.ok) {
        setTitle(""); setTime(""); setNote(""); setWhen(todayStr); setAdding(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Panel
      title="Your day"
      count={today.length ? `${today.length === 1 ? "1 THING" : `${today.length} THINGS`} TODAY` : ""}
    >
      {/* ---- add something of your own ------------------------------- */}
      {adding ? (
        <div style={{
          flex: "0 0 auto", margin: "10px 12px 4px",
          border: `1.5px solid ${C.hairline}`, borderRadius: "12px", background: "#FCFCFD",
        }}>
          <input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            placeholder="Meeting, call, visit…"
            aria-label="What is it"
            style={{
              width: "100%", border: 0, outline: 0, background: "transparent",
              font: `400 15.5px/1.3 ${F.ui}`, color: C.ink, padding: "10px 12px 6px",
            }}
          />

          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            gap: "6px", padding: "0 8px 8px",
          }}>
            {/* Today and tomorrow get a chip each; everything else is the
                picker, because a week of named buttons is a week of buttons. */}
            <div style={{ display: "flex", background: C.segment, borderRadius: "8px", padding: "2px", gap: "2px" }}>
              {([["Today", todayStr], ["Tomorrow", tomorrowStr]] as const).map(([text, v]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWhen(v)}
                  style={{
                    border: 0, borderRadius: "6px", padding: "5px 9px", cursor: "pointer",
                    background: when === v ? C.white : "transparent",
                    color: when === v ? C.ink : QUIET,
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
                padding: "5px 8px", font: `500 12.5px/1.2 ${F.ui}`, color: C.ink,
              }}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Time, if it has one"
              style={{
                background: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px",
                padding: "5px 8px", font: `500 12.5px/1.2 ${F.ui}`, color: C.ink,
              }}
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="Who with, or where"
              aria-label="Who with, or where"
              style={{
                flex: "1 1 120px", minWidth: "90px",
                background: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px",
                padding: "5px 8px", font: `400 12.5px/1.2 ${F.ui}`, color: C.ink, outline: 0,
              }}
            />
          </div>

          {/* The hint keeps its own line: this quarter is the narrow one, and
              a wrapping sentence was pushing itself under the buttons. */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 8px",
            padding: "0 10px 9px",
          }}>
            <span style={{
              flex: "1 1 100%",
              font: `500 10px/1.4 ${F.data}`, letterSpacing: ".06em",
              color: error ? C.destructive : FAINT,
            }}>
              {error ?? (time ? "ENTER ↵" : "NO TIME = ALL DAY")}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => { setAdding(false); setError(null); }}
                style={{
                  background: "transparent", border: 0, color: FAINT,
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
                  padding: "7px 11px", font: `600 12.5px/1 ${F.ui}`, cursor: "pointer",
                }}
              >
                Add to my day
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "10px 18px 2px" }}>
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              display: "flex", alignItems: "center", gap: "7px", width: "100%",
              background: "transparent", border: `1px dashed ${C.outline}`, borderRadius: "10px",
              padding: "8px 11px", color: C.blue, font: `600 13px/1 ${F.ui}`, cursor: "pointer",
            }}
          >
            + Add a meeting or event
          </button>
        </div>
      )}

      {day.length === 0 ? (
        <Empty line="Nothing booked this week. Add your own meetings above; events you book with a school show up here too." />
      ) : null}

      {today.map((d) => <DayRow key={d.id} d={d} start={start} ruled />)}

      {rest.length ? (
        <>
          <div style={{
            padding: "12px 18px 4px", font: `600 10.5px/1 ${F.data}`,
            letterSpacing: ".1em", color: FAINT,
          }}>
            LATER
          </div>
          {rest.map((d) => <DayRow key={d.id} d={d} start={start} />)}
        </>
      ) : null}
    </Panel>
  );
}

function DayRow({ d, start, ruled }: {
  d: DayItem; start: (fn: () => void) => void; ruled?: boolean;
}) {
  const stamp = ruled
    ? (d.time ?? "ALL DAY")
    : d.when.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }).toUpperCase();

  return (
    <div style={{
      display: "flex", gap: "14px", alignItems: "flex-start",
      padding: ruled ? "10px 18px" : "7px 18px",
      borderBottom: ruled ? `1px solid ${RULE}` : undefined,
    }}>
      <span style={{
        flex: "0 0 52px",
        font: ruled ? `600 13px/1.45 ${F.data}` : `600 10.5px/1.7 ${F.data}`,
        letterSpacing: ruled ? 0 : ".06em",
        color: ruled ? C.ink : QUIET,
      }}>
        {stamp}
      </span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          font: ruled ? `600 15px/1.3 ${F.ui}` : `400 15px/1.45 ${F.read}`,
          color: ruled ? C.ink : "#1F304D",
        }}>
          {d.title}
        </div>
        {d.meta ? <Meta text={d.meta} /> : null}
      </div>

      {/* Only your own entries can be taken out; a booking with a school is
          the school's record, and it leaves through the school's page. */}
      {d.own ? (
        <button
          type="button"
          aria-label="Remove from your day"
          onClick={() => start(() => { void dropDeskEvent(d.own!); })}
          style={{
            background: "transparent", border: 0, color: SOFT,
            font: `400 18px/1 ${F.ui}`, cursor: "pointer", padding: "0 2px",
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
