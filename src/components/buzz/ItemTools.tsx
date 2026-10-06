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
  /** Yours sit on the right, as they do in every chat anybody already uses. */
  mine: boolean;
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
  // Closed to start, however many there are. The count on the button says
  // there is something to read, and a feed where every thread is open is a
  // feed you have to scroll past rather than scan.
  const [open, setOpen] = useState(false);
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
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            style={{
              ...quiet,
              display: "inline-flex", alignItems: "center", gap: "6px",
              color: thread.length > 0 && !open ? C.blue : C.muted,
            }}
          >
            <span aria-hidden="true" style={{
              display: "inline-block", fontSize: "10px", lineHeight: 1,
              transform: open ? "rotate(90deg)" : "none", transition: "transform .12s",
            }}>
              ▶
            </span>
            {thread.length === 0
              ? "Comment"
              : open
                ? "Hide"
                : `${thread.length} ${thread.length === 1 ? "comment" : "comments"}`}
          </button>
        )}

        {superAdmin && (
          /* Hidden until the switch in the masthead turns them on — see
             AdminToggle. Cosmetic: each action is refused server-side too. */
          <span className="joc-admin-tools" style={{ display: "contents" }}>
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
          </span>
        )}

        {error && <span style={{ ...label, color: C.orangeText }}>{error}</span>}
      </div>

      {/* ── The thread ──────────────────────────────────────────────── */}
      {open && canComment && (
        <div style={{
          marginTop: "12px", paddingTop: "14px",
          borderTop: `1px solid ${C.hairline}`,
          display: "grid", gap: "8px",
        }}>
          {thread.map((n, i) => {
            // One name per run, the way a chat does it — six bubbles from
            // Gilad do not need his name six times.
            const sameAsLast = i > 0 && thread[i - 1].who === n.who && thread[i - 1].mine === n.mine;
            return (
              <div
                key={n.id}
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: n.mine ? "flex-end" : "flex-start",
                  marginTop: sameAsLast ? "-4px" : 0,
                }}
              >
                {!sameAsLast && (
                  <p style={{
                    ...label, color: C.muted, margin: "0 0 3px",
                    padding: n.mine ? "0 4px 0 0" : "0 0 0 4px",
                  }}>
                    {n.mine ? "You" : n.who} · {n.when}
                  </p>
                )}
                <div style={{
                  maxWidth: "min(84%, 46ch)",
                  backgroundColor: n.mine ? C.blueTint : C.panel,
                  border: `1px solid ${n.mine ? "#CBD5F2" : C.hairline}`,
                  borderRadius: "16px",
                  // The flat corner on the side it came from, as a tail.
                  borderTopRightRadius: n.mine && !sameAsLast ? "5px" : "16px",
                  borderTopLeftRadius: !n.mine && !sameAsLast ? "5px" : "16px",
                  padding: "9px 13px",
                }}>
                  <p style={{
                    fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.ink,
                    margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {n.body}
                  </p>
                </div>
              </div>
            );
          })}

          <form
            action={() => {
              const text = body.trim();
              if (!text) return;
              const optimistic: Note = {
                id: `pending-${Date.now()}`, body: text, who: "You", when: "just now", mine: true,
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
