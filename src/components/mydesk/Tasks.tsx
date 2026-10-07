"use client";

import { useState, useTransition } from "react";
import { C, F } from "@/lib/joc-tokens";
import {
  Panel, GroupHead, Empty, Initial, Meta, row, linkBtn, QUIET, FAINT, SOFT, RULE,
} from "./parts";
import { addTask, handOff, tickTask, moveTask, dropTask, nudge } from "@/app/actions/my-desk";
import type { Task } from "@/lib/my-desk";

/**
 * The list, and the one row that fills it.
 *
 * There is a single add row rather than an "add" and a separate "assign":
 * choosing a person is what turns a task into a hand-off. Same sentence, same
 * Enter key, and the only thing that changes is whose desk it lands on.
 *
 * The people are chips that open under the row rather than a dropdown over
 * it — eight colleagues fit, and a menu that covers the thing you are typing
 * is a menu you have to close to check your own sentence.
 */

const STATUS_TONE: Record<string, string> = {
  "NOT OPENED": QUIET,
  SEEN: C.blue,
  NUDGED: C.orangeText,
  DONE: "#4FAE6E",
};

export function Tasks({ tasks, handed, staff }: {
  tasks: Task[]; handed: Task[]; staff: { id: string; name: string }[];
}) {
  const [draft, setDraft] = useState("");
  const [forId, setForId] = useState<string | null>(null);
  const [later, setLater] = useState(false);
  const [picking, setPicking] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [pending, start] = useTransition();

  const forName = staff.find((s) => s.id === forId)?.name ?? "Me";
  const open = tasks.filter((t) => !t.done);
  const openHanded = handed.filter((t) => !t.done);
  const today = open.filter((t) => !t.later);
  const laterOnes = open.filter((t) => t.later);
  const finished = [...tasks, ...handed].filter((t) => t.done);
  const nothing = open.length === 0 && openHanded.length === 0 && finished.length === 0;

  const count = open.length || openHanded.length
    ? `${today.length} TODAY · ${open.length + openHanded.length} OPEN`
    : "";

  function submit() {
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    start(async () => {
      if (forId) await handOff(text, forId);
      else await addTask(text, later);
    });
  }

  return (
    <Panel title="Tasks" count={count}>
      {/* ---- the add row -------------------------------------------- */}
      <div style={{
        flex: "0 0 auto", margin: "10px 12px 4px",
        border: `1.5px solid ${C.hairline}`, borderRadius: "12px", background: "#FCFCFD",
      }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={forId ? `What should ${forName} do?` : "Add a task…"}
          aria-label={forId ? `What should ${forName} do?` : "Add a task"}
          style={{
            width: "100%", border: 0, outline: 0, background: "transparent",
            font: `400 15.5px/1.3 ${F.ui}`, color: C.ink, padding: "10px 12px 6px",
          }}
        />

        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: "8px", padding: "0 8px 8px",
        }}>
          <button
            type="button"
            onClick={() => setPicking((p) => !p)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: C.white, border: `1px solid ${C.hairline}`, borderRadius: "8px",
              padding: "5px 9px", font: `500 12.5px/1 ${F.ui}`, color: C.ink, cursor: "pointer",
            }}
          >
            <span style={{ font: `600 10px/1 ${F.data}`, letterSpacing: ".06em", color: FAINT }}>
              FOR
            </span>
            {forName} ▾
          </button>

          {/* Today / Later, as a segmented control. */}
          <div style={{ display: "flex", background: C.segment, borderRadius: "8px", padding: "2px", gap: "2px" }}>
            {([["Today", false], ["Later", true]] as const).map(([text, v]) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setLater(v)}
                style={{
                  border: 0, borderRadius: "6px", padding: "5px 9px", cursor: "pointer",
                  background: later === v ? C.white : "transparent",
                  color: later === v ? C.ink : QUIET,
                  font: `${later === v ? 600 : 500} 12.5px/1 ${F.ui}`,
                  boxShadow: later === v ? "0 1px 2px rgba(16,35,63,.08)" : "none",
                }}
              >
                {forId && v ? "This week" : text}
              </button>
            ))}
          </div>

          <span style={{
            marginLeft: "auto", font: `500 10px/1 ${F.data}`,
            letterSpacing: ".06em", color: FAINT,
          }}>
            {forId ? `ENTER ↵ SENDS TO ${forName.toUpperCase()}` : "ENTER ↵"}
          </span>
        </div>

        {picking ? (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "6px",
            padding: "8px", borderTop: `1px solid ${C.hairline}`,
          }}>
            {[{ id: null as string | null, name: "Me" }, ...staff].map((p) => {
              const on = forId === p.id;
              return (
                <button
                  key={p.id ?? "me"}
                  type="button"
                  onClick={() => { setForId(p.id); setPicking(false); }}
                  style={{
                    background: on ? C.ink : "#F4F1E9", color: on ? C.white : C.ink,
                    border: 0, borderRadius: "20px", padding: "6px 11px",
                    font: `${on ? 600 : 500} 12.5px/1 ${F.ui}`, cursor: "pointer",
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* ---- the groups ---------------------------------------------- */}
      {nothing ? (
        <Empty
          head="Nothing here yet."
          line="Type above to add your first task. Things people ask you to do, and notes you move off the Buzz, land here too."
        />
      ) : null}

      {today.length ? (
        <>
          <GroupHead text="Today" count={today.length} />
          {today.map((t) => <Row key={t.id} t={t} start={start} />)}
        </>
      ) : null}

      {laterOnes.length ? (
        <>
          <GroupHead text="Later" count={laterOnes.length} />
          {laterOnes.map((t) => <Row key={t.id} t={t} start={start} />)}
        </>
      ) : null}

      {openHanded.length ? (
        <>
          <GroupHead text="Handed off · waiting on others" count={openHanded.length} />
          {openHanded.map((t) => <Row key={t.id} t={t} start={start} />)}
        </>
      ) : null}

      {finished.length ? (
        <>
          <div style={{ padding: "8px 18px 12px", borderTop: `1px solid ${RULE}` }}>
            <button
              type="button"
              onClick={() => setShowDone((d) => !d)}
              style={{
                background: "transparent", border: 0, padding: "4px 0", color: QUIET,
                font: `500 10.5px/1 ${F.data}`, letterSpacing: ".06em", cursor: "pointer",
              }}
            >
              {finished.length} DONE {showDone ? "▴" : "▾"}
            </button>
          </div>
          {showDone ? finished.map((t) => <Row key={t.id} t={t} start={start} />) : null}
        </>
      ) : null}
    </Panel>
  );
}

function Row({ t, start }: { t: Task; start: (fn: () => void) => void }) {
  const run = (fn: () => Promise<unknown>) => () => start(() => { void fn(); });

  return (
    <div style={row}>
      {/* A hand-off keeps the other person in front of it whether or not it
          is finished: the circle here is never yours to tick, because the
          task is theirs. */}
      {t.handedTo ? (
        <Initial letter={t.handedTo.initial} />
      ) : (
        <button
          type="button"
          aria-label={t.done ? "Not done after all" : "Done"}
          onClick={run(() => tickTask(t.id, !t.done))}
          style={{
            flex: "0 0 20px", height: "20px", marginTop: "1px", borderRadius: "50%",
            cursor: "pointer", padding: 0,
            border: t.done ? 0 : `1.5px solid ${C.ringQuiet}`,
            background: t.done ? C.blue : C.white,
            color: C.white, font: `600 11px/20px ${F.ui}`,
          }}
        >
          {t.done ? "✓" : ""}
        </button>
      )}

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          font: `${t.done ? 400 : 500} 15px/1.35 ${F.ui}`,
          color: t.done ? FAINT : C.ink,
          textDecoration: t.done ? "line-through" : "none",
          textWrap: "pretty",
        }}>
          {t.text}
        </div>
        {t.handedTo ? (
          <Meta
            text={`${t.handedTo.name.toUpperCase()} · ${t.handedTo.status}`}
            tone={STATUS_TONE[t.handedTo.status] ?? QUIET}
          />
        ) : t.meta ? (
          <Meta text={t.meta} />
        ) : null}
      </div>

      {t.later && !t.done ? (
        <button type="button" onClick={run(() => moveTask(t.id, false))} style={linkBtn}>
          Today
        </button>
      ) : null}
      {t.handedTo && !t.done ? (
        <button type="button" onClick={run(() => nudge(t.id))} style={linkBtn}>
          Nudge
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Remove"
        onClick={run(() => dropTask(t.id))}
        style={{
          background: "transparent", border: 0, color: SOFT,
          font: `400 18px/1 ${F.ui}`, cursor: "pointer", padding: "0 2px",
        }}
      >
        ×
      </button>
    </div>
  );
}
