"use client";

import { useState, useTransition } from "react";
import { addNote, editUpdate, assignUpdate, removeUpdate, setBuzzDone } from "@/app/actions/buzz-item";
import { takeUpdate, releaseUpdate } from "@/app/actions/buzz-pickup";
import { markThreadSeen, markThreadUnread } from "@/app/actions/buzz-seen";
import { toggleLike } from "@/app/actions/buzz-like";

/**
 * Everything that can be done to one note, under the note.
 *
 * Built to the design handoff: one controls row with a hairline above it,
 * the claim control first in one of three states, then 👍 and Comments, and
 * read / Done pushed to the right. The thread opens in place as a grey panel
 * with bubbles, yours on the right.
 *
 * Two bars: anybody who can read the Buzz can claim, like, comment and mark
 * done; edit, tag and remove are a super admin's and sit on their own line
 * behind the Admin tools switch.
 */

export type Note = {
  id: string;
  body: string;
  who: string;
  when: string;
  mine: boolean;
};

export function ItemTools({
  activityId, detail, notes, unread, likes, liked, takenBy, mine, canPick,
  canComment, superAdmin, people, doneBy,
}: {
  activityId: string;
  detail: string | null;
  notes: Note[];
  unread: number;
  likes: number;
  liked: boolean;
  takenBy: string | null;
  mine: boolean;
  canPick: boolean;
  canComment: boolean;
  superAdmin: boolean;
  people: { id: string; name: string }[];
  /** Who marked it dealt with, for everybody. */
  doneBy: string | null;
}) {
  const [thread, setThread] = useState<Note[]>(notes);
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState(unread);
  const [body, setBody] = useState("");
  const [held, setHeld] = useState<{ by: string | null; mine: boolean }>({ by: takenBy, mine });
  const [cheer, setCheer] = useState({ n: likes, on: liked });
  const [done, setDone] = useState<string | null>(doneBy);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(detail ?? "");
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, undo?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) { undo?.(); setError(res.error ?? "That didn't save."); }
    });
  };

  if (gone) {
    return (
      <div style={{ ...rowTop, gap: "10px" }}>
        <span style={monoFaint}>Removed from the Buzz</span>
        <button type="button" style={plain} onClick={() => run(() => removeUpdate(activityId, false), () => setGone(true))}>
          Undo
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Dealt with, for everybody ───────────────────────────────── */}
      {done && (
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px",
          background: "#E3F4E8", borderRadius: "10px", padding: "8px 12px",
          margin: "-4px -4px 12px",
        }}>
          <span style={{ font: "600 10.5px/1 var(--font-mono)", letterSpacing: ".08em" }}>✓ DONE</span>
          <span style={{ font: "400 13px/1.3 var(--font-outfit)", color: "#2C3C5A", flex: 1 }}>
            Marked done by {done}
          </span>
          <button
            type="button"
            style={plain}
            onClick={() => {
              setDone(null);
              run(() => setBuzzDone(activityId, false), () => setDone(doneBy));
            }}
          >
            Reopen
          </button>
        </div>
      )}

      {editing && (
        <div style={{ marginTop: "10px" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              font: "400 16px/1.5 var(--font-newsreader)", color: "#1F304D",
              background: "#fff", border: "1px solid #E3E6EF", borderRadius: "12px",
              padding: "11px 13px",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button type="button" style={outlined} disabled={busy} onClick={() => {
              setEditing(false);
              run(() => editUpdate(activityId, text));
            }}>
              Save
            </button>
            <button type="button" style={plain} onClick={() => { setText(detail ?? ""); setEditing(false); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── The controls ────────────────────────────────────────────── */}
      <div style={rowTop}>
        {!done && held.by && !held.mine && (
          <span style={{
            background: "#F1F3F8", color: "#3B4A66", borderRadius: "9px",
            padding: "9px 12px", font: "500 13px/1 var(--font-outfit)",
          }}>
            {held.by} has this
          </span>
        )}

        {!done && held.mine && (
          <button
            type="button"
            style={{
              background: "#E3F4E8", color: "#10233F", border: 0, borderRadius: "9px",
              padding: "9px 12px", font: "600 13px/1 var(--font-outfit)", cursor: "pointer",
            }}
            onClick={() => {
              const before = held;
              setHeld({ by: null, mine: false });
              run(() => releaseUpdate(activityId, false), () => setHeld(before));
            }}
          >
            ✓ On your list
          </button>
        )}

        {!done && !held.by && canPick && (
          <button
            type="button"
            style={outlined}
            onClick={() => {
              setHeld({ by: "you", mine: true });
              run(() => takeUpdate(activityId), () => setHeld({ by: null, mine: false }));
            }}
          >
            Move to my desk
          </button>
        )}

        <button
          type="button"
          aria-pressed={cheer.on}
          onClick={() => {
            const before = cheer;
            const next = { n: cheer.n + (cheer.on ? -1 : 1), on: !cheer.on };
            setCheer(next);
            void toggleLike(activityId, next.on).then((r) => { if (!r.ok) setCheer(before); });
          }}
          style={{
            background: cheer.on ? "#E4E9F8" : "transparent",
            color: cheer.on ? "#2D46AF" : "#3B4A66",
            border: 0, borderRadius: "9px", padding: "8px 10px",
            font: `${cheer.on ? 600 : 500} 13px/1 var(--font-outfit)`, cursor: "pointer",
          }}
        >
          👍 {cheer.n > 0 ? cheer.n : ""}
        </button>

        {canComment && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => {
              const next = !open;
              setOpen(next);
              if (next && fresh > 0) { setFresh(0); void markThreadSeen(activityId); }
            }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "transparent", color: "#3B4A66", border: 0, borderRadius: "9px",
              padding: "8px 10px", font: "500 13px/1 var(--font-outfit)", cursor: "pointer",
            }}
          >
            Comments {thread.length}
            {fresh > 0 && (
              <span style={{
                background: "#2D46AF", color: "#fff", borderRadius: "10px",
                padding: "3px 6px", font: "600 10px/1 var(--font-mono)",
              }}>
                {fresh} NEW
              </span>
            )}
          </button>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: "2px", alignItems: "center" }}>
          {canComment && thread.length > 0 && (
            <button
              type="button"
              style={plainGrey}
              onClick={() => {
                if (fresh > 0) { setFresh(0); void markThreadSeen(activityId); }
                else { setFresh(thread.length); void markThreadUnread(activityId); }
              }}
            >
              {fresh > 0 ? "Mark read" : "Mark unread"}
            </button>
          )}

          {!done && canPick && (
            <button
              type="button"
              style={outlinedInk}
              onClick={() => {
                setDone("you");
                run(() => setBuzzDone(activityId, true), () => setDone(null));
              }}
            >
              ✓ Done
            </button>
          )}
        </div>

        {error && <span style={{ ...monoFaint, color: "#B4541A" }}>{error}</span>}
      </div>

      {/* ── A super admin's own line ────────────────────────────────── */}
      {superAdmin && (
        <div className="joc-admin-tools" style={{
          display: "flex", gap: "14px", alignItems: "center",
          font: "600 13px/1 var(--font-outfit)", padding: "10px 2px 2px",
        }}>
          <span style={{ font: "500 10.5px/13px var(--font-mono)", letterSpacing: ".08em", color: "#8A97B3" }}>
            ADMIN
          </span>
          <button type="button" style={adminLink} onClick={() => { setText(detail ?? ""); setEditing((e) => !e); }}>
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
            style={{ ...adminLink, maxWidth: "140px" }}
          >
            <option value="">Tag someone</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            type="button"
            style={{ ...adminLink, color: "#B4541A" }}
            onClick={() => { setGone(true); run(() => removeUpdate(activityId, true), () => setGone(false)); }}
          >
            Remove
          </button>
        </div>
      )}

      {/* ── The thread ──────────────────────────────────────────────── */}
      {open && canComment && (
        <div style={{
          marginTop: "10px", background: "#F5F6FA", borderRadius: "12px", padding: "12px",
          display: "flex", flexDirection: "column", gap: "8px",
        }}>
          {thread.map((n) => (
            n.mine ? (
              <div key={n.id} style={{
                alignSelf: "flex-end", maxWidth: "82%", background: "#2D46AF", color: "#fff",
                borderRadius: "14px 14px 4px 14px", padding: "8px 11px",
                font: "400 14.5px/1.4 var(--font-newsreader)", whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                {n.body}
                <div style={{ font: "500 9.5px/1 var(--font-mono)", opacity: 0.75, marginTop: "4px", textAlign: "right" }}>
                  {n.when}
                </div>
              </div>
            ) : (
              <div key={n.id} style={{
                alignSelf: "flex-start", maxWidth: "82%", background: "#fff",
                border: "1px solid #E3E6EF", borderRadius: "14px 14px 14px 4px",
                padding: "8px 11px", color: "#1F304D",
                font: "400 14.5px/1.4 var(--font-newsreader)", whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                <div style={{ font: "600 12px/1 var(--font-outfit)", color: "#10233F", marginBottom: "4px" }}>
                  {n.who}
                </div>
                {n.body}
                <div style={{ font: "500 9.5px/1 var(--font-mono)", color: "#8A97B3", marginTop: "4px" }}>
                  {n.when}
                </div>
              </div>
            )
          ))}

          <form
            action={() => {
              const value = body.trim();
              if (!value) return;
              const optimistic: Note = {
                id: `pending-${Date.now()}`, body: value, who: "You", when: "just now", mine: true,
              };
              setThread((t) => [...t, optimistic]);
              setBody("");
              run(() => addNote(activityId, value), () => setThread((t) => t.filter((x) => x.id !== optimistic.id)));
            }}
            style={{ display: "flex", gap: "8px", marginTop: "2px" }}
          >
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment"
              style={{
                flex: 1, minWidth: 0, border: "1px solid #E3E6EF", borderRadius: "20px",
                padding: "9px 13px", font: "400 14px/1.2 var(--font-outfit)",
                outline: 0, background: "#fff", color: "#10233F",
              }}
            />
            <button type="submit" disabled={busy} style={{
              background: "#2D46AF", color: "#fff", border: 0, borderRadius: "20px",
              padding: "0 14px", minHeight: "38px", font: "600 13px/1 var(--font-outfit)",
              cursor: "pointer",
            }}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const rowTop: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px",
  borderTop: "1px solid #E3E6EF", marginTop: "14px", paddingTop: "11px",
};

const outlined: React.CSSProperties = {
  background: "#fff", color: "#2D46AF", border: "1.5px solid #CBD3EE",
  borderRadius: "9px", padding: "8px 12px",
  font: "600 13px/1 var(--font-outfit)", cursor: "pointer",
};

const outlinedInk: React.CSSProperties = {
  background: "transparent", color: "#10233F", border: "1.5px solid #CBD3EE",
  borderRadius: "9px", padding: "7px 11px",
  font: "600 13px/1 var(--font-outfit)", cursor: "pointer",
};

const plain: React.CSSProperties = {
  background: "transparent", border: 0, padding: 0, color: "#2D46AF",
  font: "600 13px/1 var(--font-outfit)", cursor: "pointer",
};

const plainGrey: React.CSSProperties = {
  background: "transparent", border: 0, borderRadius: "9px", padding: "8px 10px",
  color: "#3B4A66", font: "500 13px/1 var(--font-outfit)", cursor: "pointer",
};

const adminLink: React.CSSProperties = {
  background: "transparent", border: 0, padding: 0, color: "#2D46AF",
  font: "600 13px/1 var(--font-outfit)", cursor: "pointer",
};

const monoFaint: React.CSSProperties = {
  font: "500 10.5px/1 var(--font-mono)", letterSpacing: ".08em",
  textTransform: "uppercase", color: "#8A97B3",
};
