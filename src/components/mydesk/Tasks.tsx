"use client";

import { useState, useTransition } from "react";
import { C, F, R, label } from "@/lib/joc-tokens";
import { Panel, GroupHead, Empty, Initial, Meta, btn, SUB } from "./parts";
import { addTask, handOff, tickTask, moveTask, dropTask, nudge } from "@/app/actions/my-desk";
import type { Task } from "@/lib/my-desk";

/**
 * The list, and the one row that fills it.
 *
 * There is a single add row rather than an "add" and a separate "assign":
 * choosing a person is what turns a task into a hand-off. Same sentence, same
 * Enter key, and the only thing that changes is whose desk it lands on.
 */

const STATUS_TONE: Record<string, string> = {
  "NOT OPENED": C.faint,
  SEEN: C.blue,
  NUDGED: C.orangeText,
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
  const [pending, start] = useTransition();

  const forName = staff.find((s) => s.id === forId)?.name ?? "Me";
  const open = tasks.filter((t) => !t.done);
  const openHanded = handed.filter((t) => !t.done);
  const today = open.filter((t) => !t.later);
  const laterOnes = open.filter((t) => t.later);
  const finished = [...tasks, ...handed].filter((t) => t.done);

  const count = open.length
    ? `${today.length} TODAY · ${open.length + openHanded.length} OPEN`
    : openHanded.length
      ? `${openHanded.length} WAITING`
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
      <div
        style={{
          border: `1px solid ${C.hairline}`, borderRadius: R.form,
          padding: "10px 12px", backgroundColor: "#FCFCFD",
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={forId ? `What should ${forName} do?` : "Add a task…"}
          aria-label={forId ? `What should ${forName} do?` : "Add a task"}
          style={{
            width: "100%", border: "none", outline: "none", background: "transparent",
            fontFamily: F.ui, fontSize: "15px", color: C.ink, padding: "2px 0 8px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setPicking((p) => !p)}
              style={{ ...btn.base, ...btn.bare, color: SUB, fontFamily: F.data, fontSize: "11px", letterSpacing: ".04em" }}
            >
              FOR <strong style={{ color: C.ink, fontWeight: 600 }}>{forName}</strong> ▾
            </button>

            {picking ? (
              <div
                style={{
                  position: "absolute", zIndex: 5, top: "100%", left: 0, marginTop: "4px",
                  backgroundColor: C.white, border: `1px solid ${C.hairline}`,
                  borderRadius: R.form, boxShadow: "0 8px 24px rgba(16,35,63,.14)",
                  padding: "6px", minWidth: "150px", maxHeight: "190px", overflow: "auto",
                }}
              >
                {[{ id: null as string | null, name: "Me" }, ...staff].map((p) => (
                  <button
                    key={p.id ?? "me"}
                    type="button"
                    onClick={() => { setForId(p.id); setPicking(false); }}
                    style={{
                      ...btn.base, display: "block", width: "100%", textAlign: "left",
                      backgroundColor: forId === p.id ? C.blueTint : "transparent",
                      color: forId === p.id ? C.blue : C.ink, border: "none",
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!forId ? (
            <div style={{ display: "flex", gap: "4px" }}>
              {[["Today", false], ["Later", true]].map(([text, v]) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setLater(v as boolean)}
                  style={{
                    ...btn.base, padding: "5px 10px", minHeight: "26px", fontSize: "12px",
                    borderRadius: R.chip,
                    backgroundColor: later === v ? C.ink : "transparent",
                    color: later === v ? C.white : C.faint,
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          ) : null}

          <span style={{ ...label, color: C.outline, marginLeft: "auto" }}>
            {forId ? `ENTER ↵ SENDS TO ${forName.toUpperCase()}` : "ENTER ↵"}
          </span>
        </div>
      </div>

      {/* ---- the groups ---------------------------------------------- */}
      {open.length === 0 && openHanded.length === 0 && finished.length === 0 ? (
        <Empty
          head="Nothing here yet."
          line="Type above, take something off the Buzz, or wait for somebody to hand you a job."
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
        <div style={{ marginTop: "14px" }}>
          <button
            type="button"
            onClick={() => setShowDone((d) => !d)}
            style={{ ...btn.base, ...btn.bare, ...label, color: C.faint, padding: "4px 0" }}
          >
            {finished.length} DONE {showDone ? "▴" : "▾"}
          </button>
          {showDone ? finished.map((t) => <Row key={t.id} t={t} start={start} />) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function Row({ t, start }: { t: Task; start: (fn: () => void) => void }) {
  const run = (fn: () => Promise<unknown>) => () => start(() => { void fn(); });

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "9px 2px", borderBottom: `1px solid ${C.hairline}`,
      }}
    >
      {t.handedTo ? (
        <Initial letter={t.handedTo.initial} tone={t.done ? "green" : "blue"} />
      ) : (
        <button
          type="button"
          aria-label={t.done ? "Not done after all" : "Done"}
          onClick={run(() => tickTask(t.id, !t.done))}
          style={{
            flex: "0 0 auto", width: "19px", height: "19px", marginTop: "2px",
            borderRadius: "9999px", cursor: "pointer",
            border: `1.5px solid ${t.done ? C.green : C.ringQuiet}`,
            backgroundColor: t.done ? C.green : "transparent",
            color: C.white, fontSize: "11px", lineHeight: 1, padding: 0,
          }}
        >
          {t.done ? "✓" : ""}
        </button>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: F.ui, fontSize: "14.5px", fontWeight: 500, margin: 0,
            color: t.done ? C.faint : C.ink,
            textDecoration: t.done ? "line-through" : "none",
          }}
        >
          {t.text}
        </p>
        {t.handedTo ? (
          <Meta
            text={`${t.handedTo.name.toUpperCase()} · ${t.handedTo.status}`}
            tone={STATUS_TONE[t.handedTo.status] ?? C.faint}
          />
        ) : t.meta ? (
          <Meta text={t.meta} />
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: "0 0 auto" }}>
        {t.later && !t.done ? (
          <button type="button" onClick={run(() => moveTask(t.id, false))} style={{ ...btn.base, ...btn.bare, color: C.blue }}>
            Today
          </button>
        ) : null}
        {t.handedTo && !t.done ? (
          <button type="button" onClick={run(() => nudge(t.id))} style={{ ...btn.base, ...btn.bare, color: C.blue }}>
            Nudge
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Remove"
          onClick={run(() => dropTask(t.id))}
          style={{ ...btn.base, ...btn.bare, fontSize: "15px", color: C.outline }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
