"use client";

import { useState, useTransition } from "react";
import { addTodo, setTodoDone, removeTodo } from "@/app/actions/desk";
import type { DeskTodo } from "@/lib/desk";
import { C, F } from "@/lib/joc-tokens";

/**
 * Your list.
 *
 * Three kinds of thing in one row: what you typed, what you took off the
 * Buzz, what somebody handed you. They look identical on purpose — a list
 * that sorts itself by where an item came from is a list nobody works
 * through. The only thing that separates them is the mono line underneath,
 * which says where it came from and when it is wanted.
 *
 * The add box is the first row, not a button somewhere: adding something has
 * to cost one keystroke or it gets written on paper instead.
 */

const SHOW = 5;

export function YourList({ todos }: { todos: DeskTodo[] }) {
  const [items, setItems] = useState(todos);
  const [text, setText] = useState("");
  const [all, setAll] = useState(false);
  const [openDone, setOpenDone] = useState(false);
  const [, start] = useTransition();

  const open = items.filter((t) => !t.done);
  const done = items.filter((t) => t.done);
  const shown = all ? open : open.slice(0, SHOW);

  const tick = (t: DeskTodo, next: boolean) => {
    setItems((list) => list.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    start(async () => {
      const res = await setTodoDone(t.id, next);
      if (!res.ok) setItems((list) => list.map((x) => (x.id === t.id ? { ...x, done: !next } : x)));
    });
  };

  return (
    <div style={card}>
      <p style={head}>Your list</p>

      {/* The add row, always first. */}
      <form
        action={() => {
          const body = text.trim();
          if (!body) return;
          const optimistic: DeskTodo = {
            id: `pending-${Date.now()}`, text: body,
            meta: "ADDED BY YOU · JUST NOW", done: false, activityId: null,
          };
          setItems((list) => [optimistic, ...list]);
          setText("");
          start(async () => {
            const res = await addTodo(body);
            if (res.ok && res.id) {
              setItems((list) => list.map((x) => (x.id === optimistic.id ? { ...x, id: res.id! } : x)));
            } else {
              setItems((list) => list.filter((x) => x.id !== optimistic.id));
            }
          });
        }}
        style={{ display: "flex", alignItems: "center", gap: "11px", padding: "11px 0" }}
      >
        <span aria-hidden="true" style={{
          width: "22px", height: "22px", flex: "0 0 auto", borderRadius: "50%",
          border: `1.5px dashed ${C.ringQuiet}`, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: C.faint, fontSize: "14px", lineHeight: 1,
        }}>
          +
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add something to your list"
          aria-label="Add something to your list"
          style={{
            flex: "100 1 auto", minWidth: 0, border: "none",
            background: "transparent", padding: 0,
            fontFamily: F.ui, fontSize: "15px", fontWeight: 500, color: C.ink,
          }}
        />
        {text.trim() && (
          <span style={{ ...mono, color: C.faint, flex: "0 0 auto" }}>ENTER ↵</span>
        )}
      </form>

      {shown.map((t) => (
        <Row key={t.id} todo={t} onTick={() => tick(t, true)} />
      ))}

      {open.length === 0 && (
        <p style={{
          fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted,
          margin: "6px 0 2px", maxWidth: "46ch",
        }}>
          Your list is clear. Notes you take off the Buzz land here too.
        </p>
      )}

      {!all && open.length > SHOW && (
        <button type="button" onClick={() => setAll(true)} style={more}>
          {open.length - SHOW} more {open.length - SHOW === 1 ? "thing" : "things"}
        </button>
      )}

      {done.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpenDone((o) => !o)}
            style={{ ...more, color: C.faint }}
          >
            {done.length} done {openDone ? "▴" : "▾"}
          </button>
          {openDone && done.map((t) => (
            <Row key={t.id} todo={t} onTick={() => tick(t, false)} />
          ))}
        </>
      )}
    </div>
  );
}

function Row({ todo, onTick }: { todo: DeskTodo; onTick: () => void }) {
  const [, start] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "11px",
      padding: "11px 0", borderTop: `1px solid ${C.hairline}`,
    }}>
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.done ? `Undo ${todo.text}` : `Done: ${todo.text}`}
        onClick={onTick}
        style={{
          width: "22px", height: "22px", flex: "0 0 auto", marginTop: "1px",
          borderRadius: "50%", cursor: "pointer",
          border: todo.done ? "none" : `1.5px solid ${C.ringQuiet}`,
          backgroundColor: todo.done ? C.blue : "transparent",
          color: C.white, fontSize: "12px", lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {todo.done ? "✓" : ""}
      </button>

      <div style={{ flex: "100 1 auto", minWidth: 0 }}>
        <p style={{
          fontFamily: F.ui, fontSize: "15px", fontWeight: 500, lineHeight: 1.35,
          color: todo.done ? C.faint : C.ink, margin: 0,
          textDecoration: todo.done ? "line-through" : "none",
        }}>
          {todo.text}
        </p>
        <p style={{ ...mono, color: todo.done ? C.faint : C.muted, margin: "3px 0 0" }}>
          {todo.meta}
        </p>
      </div>

      {!todo.done && (
        <button
          type="button"
          aria-label={`Remove ${todo.text}`}
          onClick={() => {
            setGone(true);
            start(async () => {
              const res = await removeTodo(todo.id);
              if (!res.ok) setGone(false);
            });
          }}
          style={{
            flex: "0 0 auto", background: "none", border: "none", cursor: "pointer",
            color: C.faint, fontFamily: F.ui, fontSize: "16px", lineHeight: 1,
            padding: "2px 4px",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: "18px", padding: "16px 18px 14px",
  boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
  flex: "1 1 360px", minWidth: 0,
};

const mono: React.CSSProperties = {
  fontFamily: F.data, fontSize: "10.5px", fontWeight: 500,
  letterSpacing: "0.08em", textTransform: "uppercase", margin: 0,
};

const head: React.CSSProperties = { ...mono, color: C.muted, marginBottom: "2px" };

const more: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
  background: "none", border: "none", cursor: "pointer",
  padding: "10px 0 2px", textAlign: "left",
};
