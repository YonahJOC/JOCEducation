"use client";

import { useState, useTransition } from "react";
import { C, F, R, T, HIT } from "@/lib/joc-tokens";
import { Panel, GroupHead, Empty, Initial, Meta, row, linkBtn, removeBtn, rowBody } from "./parts";
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
  "NOT OPENED": C.faint,
  SEEN: C.blue,
  "ON THEIR LIST": C.blue,
  NUDGED: C.orangeText,
  DECLINED: C.destructive,
  DONE: C.greenText,
};

export function Tasks({ tasks, handed, staff }: {
  tasks: Task[]; handed: Task[]; staff: { id: string; name: string }[];
}) {
  const [draft, setDraft] = useState("");
  const [forId, setForId] = useState<string | null>(null);
  const [later, setLater] = useState(false);
  const [picking, setPicking] = useState(false);
  const [showDone, setShowDone] = useState(false);
  /**
   * A word when something comes off the list.
   *
   * It lasts for this visit only — there is no row for it anywhere, and it
   * disappears on the next render that doesn't set it. Ticking a thing off
   * should feel like something, and the page otherwise just gets quieter.
   */
  const [praise, setPraise] = useState<string | null>(null);
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

  /** Called the moment a tick is clicked, before the save round-trips. */
  function cheer(nowDone: boolean) {
    if (!nowDone) { setPraise(null); return; }
    const leftToday = today.filter((t) => !t.done).length - 1;
    setPraise(leftToday <= 0 ? "All done for today. Yasher koach!" : "Nice, that's one off your plate.");
  }

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
    <Panel title="Your list" count={count}>
      {/* ---- the add row -------------------------------------------- */}
      <div style={{
        flex: "0 0 auto", margin: "12px 16px 4px",
        border: `1.5px solid ${C.outline}`, borderRadius: R.form, background: C.panel,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 12px 0" }}>
          <span
            aria-hidden="true"
            className="material-symbols-rounded"
            style={{ color: C.ringQuiet, fontSize: "22px", flex: "0 0 auto" }}
          >
            add_circle
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            placeholder={forId ? `What should ${forName} do?` : "What do you need to do?"}
            aria-label={forId ? `What should ${forName} do?` : "What do you need to do?"}
            style={{
              flex: 1, minWidth: 0, border: 0, background: "transparent",
              ...T.body, fontSize: "18px", color: C.ink, padding: "12px 0 10px",
            }}
          />
        </div>

        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: "8px", padding: "0 8px 8px",
        }}>
          <button
            type="button"
            onClick={() => setPicking((p) => !p)}
            aria-expanded={picking}
            style={{
              display: "flex", alignItems: "center", gap: "6px", minHeight: HIT,
              background: C.white, border: `1px solid ${C.outline}`, borderRadius: R.sm,
              padding: "0 11px", ...T.small, color: C.ink, cursor: "pointer",
            }}
          >
            <span style={{ ...T.meta }}>FOR</span>
            {forName} ▾
          </button>

          {/* Today / Later, as a segmented control. */}
          <div style={{ display: "flex", background: C.segment, borderRadius: R.sm, padding: "3px", gap: "2px" }}>
            {([["Today", false], ["Later", true]] as const).map(([text, v]) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setLater(v)}
                aria-pressed={later === v}
                style={{
                  border: 0, borderRadius: "6px", padding: "0 12px", minHeight: "38px",
                  cursor: "pointer",
                  background: later === v ? C.white : "transparent",
                  color: later === v ? C.ink : C.faint,
                  ...T.small, fontWeight: later === v ? 600 : 500,
                  boxShadow: later === v ? "0 1px 2px rgba(16,35,63,.08)" : "none",
                }}
              >
                {forId && v ? "This week" : text}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || pending}
            style={{
              marginLeft: "auto", minHeight: HIT, padding: "0 18px",
              background: draft.trim() ? C.blue : C.outline, color: C.white,
              border: 0, borderRadius: R.sm, ...T.small, fontWeight: 700,
              cursor: draft.trim() ? "pointer" : "default",
            }}
          >
            {forId ? `Send to ${forName}` : "Add"}
          </button>
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
                    background: on ? C.ink : C.segment, color: on ? C.white : C.ink,
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

      {praise ? (
        <div style={{
          margin: "8px 16px 0", padding: "9px 12px", borderRadius: R.sm,
          background: C.greenTint, color: C.greenText, ...T.small,
        }}>
          {praise}
        </div>
      ) : null}

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
          {today.map((t) => <Row key={t.id} t={t} start={start} onTick={cheer} />)}
        </>
      ) : null}

      {laterOnes.length ? (
        <>
          <GroupHead text="Later" count={laterOnes.length} />
          {laterOnes.map((t) => <Row key={t.id} t={t} start={start} onTick={cheer} />)}
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
          <div style={{ padding: "8px 18px 12px", borderTop: `1px solid ${C.rule}` }}>
            <button
              type="button"
              onClick={() => setShowDone((d) => !d)}
              style={{
                background: "transparent", border: 0, padding: "4px 0", color: C.faint,
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

function Row({ t, start, onTick }: {
  t: Task; start: (fn: () => void) => void; onTick?: (done: boolean) => void;
}) {
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
          onClick={() => { onTick?.(!t.done); run(() => tickTask(t.id, !t.done))(); }}
          style={{
            flex: `0 0 ${HIT}`, minHeight: HIT,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: 0, cursor: "pointer", padding: 0,
          }}
        >
          {/* 30px of circle inside 44px of tap. */}
          <span style={{
            width: "30px", height: "30px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: t.done ? 0 : `2px solid ${C.ringQuiet}`,
            background: t.done ? C.green : "transparent",
            color: C.white, font: `700 15px/1 ${F.ui}`,
          }}>
            {t.done ? "✓" : ""}
          </span>
        </button>
      )}

      <div style={rowBody}>
        <div style={{
          font: `${t.done ? 400 : 500} 15px/1.35 ${F.ui}`,
          color: t.done ? C.faint : C.ink,
          textDecoration: t.done ? "line-through" : "none",
          textWrap: "pretty",
        }}>
          {t.text}
        </div>
        {t.handedTo ? (
          <Meta
            text={`${t.handedTo.name.toUpperCase()} · ${t.handedTo.status}`}
            tone={STATUS_TONE[t.handedTo.status] ?? C.faint}
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
        style={removeBtn}
      >
        ×
      </button>
    </div>
  );
}
