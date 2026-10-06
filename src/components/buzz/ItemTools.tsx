"use client";

import { useState, useTransition } from "react";
import { addNote, editUpdate, assignUpdate, removeUpdate } from "@/app/actions/buzz-item";
import { takeUpdate, releaseUpdate } from "@/app/actions/buzz-pickup";
import { C, R, F, label } from "@/lib/joc-tokens";

/**
 * Everything that can be done to one item, under the item.
 *
 * The thread is open to anybody who can read the Buzz; the rest is a super
 * admin's. Both live here so the row is one thing on the screen rather than
 * a feed with a separate admin mode layered over it.
 */

export type Note = {
  id: string;
  body: string;
  who: string;
  when: string;
};

export function ItemTools({
  activityId, detail, notes, takenBy, mine, canPick, canComment, superAdmin, people,
}: {
  activityId: string;
  detail: string | null;
  notes: Note[];
  takenBy: string | null;
  mine: boolean;
  canPick: boolean;
  canComment: boolean;
  superAdmin: boolean;
  /** Who can be tagged. Only sent to a super admin. */
  people: { id: string; name: string }[];
}) {
  const [thread, setThread] = useState<Note[]>(notes);
  const [open, setOpen] = useState(notes.length > 0);
  const [body, setBody] = useState("");
  const [held, setHeld] = useState<{ by: string | null; mine: boolean }>({ by: takenBy, mine });
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(detail ?? "");
  const [shown, setShown] = useState(detail);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, undo?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        undo?.();
        setError(res.error ?? "That didn't save.");
      }
    });
  };

  if (gone) {
    return (
      <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ ...label, color: C.muted }}>Removed from the Buzz</span>
        <button type="button" style={quiet} onClick={() => run(() => removeUpdate(activityId, false), () => setGone(true))}>
          Undo
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "10px" }}>
      {/* ── What it says, and the super admin's pencil ──────────────── */}
      {editing ? (
        <div style={{ marginBottom: "10px" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.ink,
              backgroundColor: C.white, border: `1px solid ${C.hairline}`,
              borderRadius: "12px", padding: "11px 13px",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              type="button"
              style={chip}
              disabled={busy}
              onClick={() => {
                const before = shown;
                setShown(text.trim() || null);
                setEditing(false);
                run(() => editUpdate(activityId, text), () => setShown(before));
              }}
            >
              Save
            </button>
            <button type="button" style={quiet} onClick={() => { setText(shown ?? ""); setEditing(false); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* ── The row of actions ──────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {held.by && !held.mine && (
          <span style={{ ...label, color: C.muted }}>{held.by} has this</span>
        )}

        {held.mine && (
          <>
            <span style={{
              ...label, color: C.greenText, backgroundColor: C.greenTint,
              borderRadius: R.chip, padding: "6px 10px",
            }}>
              In your console
            </span>
            <button
              type="button"
              style={quiet}
              onClick={() => {
                const before = held;
                setHeld({ by: null, mine: false });
                run(() => releaseUpdate(activityId, false), () => setHeld(before));
              }}
            >
              Put it back
            </button>
          </>
        )}

        {!held.by && canPick && (
          <button
            type="button"
            style={chip}
            onClick={() => {
              setHeld({ by: "you", mine: true });
              run(() => takeUpdate(activityId), () => setHeld({ by: null, mine: false }));
            }}
          >
            Move to my console
          </button>
        )}

        {canComment && (
          <button type="button" style={quiet} onClick={() => setOpen((o) => !o)}>
            {thread.length > 0
              ? `${thread.length} ${thread.length === 1 ? "comment" : "comments"}`
              : "Comment"}
          </button>
        )}

        {superAdmin && (
          <>
            <button type="button" style={quiet} onClick={() => { setText(shown ?? ""); setEditing((e) => !e); }}>
              Edit
            </button>

            <select
              value=""
              disabled={busy}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const name = people.find((p) => p.id === id)?.name ?? "them";
                const before = held;
                setHeld({ by: name, mine: false });
                run(() => assignUpdate(activityId, id), () => setHeld(before));
              }}
              style={{
                fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.muted,
                background: "none", border: "none", cursor: "pointer", minHeight: "38px",
                maxWidth: "150px",
              }}
            >
              <option value="">Tag someone…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <button
              type="button"
              style={{ ...quiet, color: C.orangeText }}
              onClick={() => {
                setGone(true);
                run(() => removeUpdate(activityId, true), () => setGone(false));
              }}
            >
              Remove
            </button>
          </>
        )}

        {error && <span style={{ ...label, color: C.orangeText }}>{error}</span>}
      </div>

      {/* ── The thread ──────────────────────────────────────────────── */}
      {open && canComment && (
        <div style={{
          marginTop: "12px", paddingTop: "12px",
          borderTop: `1px solid ${C.hairline}`,
          display: "grid", gap: "10px",
        }}>
          {thread.map((n) => (
            <div key={n.id}>
              <p style={{ ...label, color: C.muted, margin: "0 0 2px" }}>
                {n.who} · {n.when}
              </p>
              <p style={{
                fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.ink,
                margin: 0, whiteSpace: "pre-wrap",
              }}>
                {n.body}
              </p>
            </div>
          ))}

          <form
            action={() => {
              const text = body.trim();
              if (!text) return;
              const optimistic: Note = {
                id: `pending-${Date.now()}`, body: text, who: "You", when: "just now",
              };
              setThread((t) => [...t, optimistic]);
              setBody("");
              run(
                () => addNote(activityId, text),
                () => setThread((t) => t.filter((x) => x.id !== optimistic.id)),
              );
            }}
            style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="Add a comment"
              style={{
                flex: "100 1 200px", minWidth: 0, boxSizing: "border-box", resize: "vertical",
                fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.ink,
                backgroundColor: C.white, border: `1px solid ${C.hairline}`,
                borderRadius: "12px", padding: "10px 12px",
              }}
            />
            <button type="submit" style={{ ...chip, flex: "0 0 auto" }} disabled={busy}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const chip: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
  backgroundColor: C.white, border: `1px solid ${C.hairline}`,
  borderRadius: R.chip, padding: "8px 13px", minHeight: "38px", cursor: "pointer",
};

const quiet: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.muted,
  background: "none", border: "none", cursor: "pointer",
  padding: "6px 2px", minHeight: "38px",
};
