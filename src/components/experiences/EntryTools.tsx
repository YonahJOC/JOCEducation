"use client";

import { useState, useTransition } from "react";
import { addExperienceNote, editExperience, removeExperience } from "@/app/actions/experiences";
import { C, F } from "@/lib/joc-tokens";

/**
 * What can be done to one entry, under the entry.
 *
 * The Buzz's controls row cut down to what a department of three needs:
 * comments for anybody in it, and edit and remove for whoever wrote it (or a
 * super admin). No claiming, no desk, no likes — those exist on the Buzz
 * because forty people read it and somebody has to say "mine"; here the
 * client's owner is already on the card.
 *
 * The thread opens in place as a grey panel with bubbles, yours on the right,
 * exactly as it does on the Buzz, so nobody has to learn it twice.
 */

export type EntryNote = { id: string; body: string; who: string; when: string; mine: boolean };

export function EntryTools({
  activityId, summary, detail, groupSize, showsGroup, notes, canChange,
}: {
  activityId: string;
  summary: string;
  detail: string | null;
  groupSize: number | null;
  /** Booked or done: the only entries with a group in front of them. */
  showsGroup: boolean;
  notes: EntryNote[];
  canChange: boolean;
}) {
  const [thread, setThread] = useState<EntryNote[]>(notes);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ summary, detail: detail ?? "", groupSize: groupSize ? String(groupSize) : "" });
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
        <span style={monoFaint}>Removed</span>
        <button type="button" style={plain} onClick={() => {
          setGone(false);
          run(() => removeExperience(activityId, false), () => setGone(true));
        }}>
          Undo
        </button>
        {error && <span style={{ ...monoFaint, color: C.destructive }}>{error}</span>}
      </div>
    );
  }

  return (
    <>
      {editing && (
        <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
          <input
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            aria-label="Summary"
            maxLength={200}
            style={box}
          />
          <textarea
            value={draft.detail}
            onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
            aria-label="Detail"
            rows={4}
            style={{ ...box, resize: "vertical", font: "400 16px/1.5 var(--font-newsreader)" }}
          />
          {showsGroup && (
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={draft.groupSize}
              onChange={(e) => setDraft({ ...draft, groupSize: e.target.value })}
              aria-label="Group size"
              placeholder="Group size"
              style={{ ...box, maxWidth: "160px" }}
            />
          )}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="button" style={outlined} disabled={busy} onClick={() => {
              setEditing(false);
              run(() => editExperience(activityId, draft), () => setEditing(true));
            }}>
              Save
            </button>
            <button type="button" style={plain} onClick={() => {
              setDraft({ summary, detail: detail ?? "", groupSize: groupSize ? String(groupSize) : "" });
              setEditing(false);
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={rowTop}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          style={plainGrey}
        >
          Comments {thread.length}
        </button>

        {canChange && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "14px", alignItems: "center" }}>
            <button type="button" style={plain} onClick={() => setEditing((e) => !e)}>
              Edit
            </button>
            <button
              type="button"
              style={{ ...plain, color: C.destructive }}
              onClick={() => { setGone(true); run(() => removeExperience(activityId, true), () => setGone(false)); }}
            >
              Remove
            </button>
          </div>
        )}

        {error && <span style={{ ...monoFaint, color: C.destructive }}>{error}</span>}
      </div>

      {open && (
        <div style={{
          marginTop: "10px", background: "#F5F6FA", borderRadius: "12px", padding: "12px",
          display: "flex", flexDirection: "column", gap: "8px",
        }}>
          {thread.map((n) => (
            <div key={n.id} style={n.mine ? bubbleMine : bubbleTheirs}>
              {!n.mine && (
                <div style={{ font: "600 12px/1 var(--font-outfit)", color: C.ink, marginBottom: "4px" }}>
                  {n.who}
                </div>
              )}
              {n.body}
              <div style={{
                font: "500 9.5px/1 var(--font-mono)", marginTop: "4px",
                ...(n.mine ? { opacity: 0.75, textAlign: "right" as const } : { color: C.faint }),
              }}>
                {n.when}
              </div>
            </div>
          ))}

          <form
            action={() => {
              const value = body.trim();
              if (!value) return;
              const optimistic: EntryNote = {
                id: `pending-${Date.now()}`, body: value, who: "You", when: "just now", mine: true,
              };
              setThread((t) => [...t, optimistic]);
              setBody("");
              run(
                () => addExperienceNote(activityId, value),
                () => setThread((t) => t.filter((x) => x.id !== optimistic.id)),
              );
            }}
            style={{ display: "flex", gap: "8px", marginTop: "2px" }}
          >
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment"
              aria-label="Write a comment"
              style={{
                flex: 1, minWidth: 0, border: `1px solid ${C.hairline}`, borderRadius: "20px",
                padding: "9px 13px", font: "400 14px/1.2 var(--font-outfit)", background: "#fff", color: C.ink,
              }}
            />
            <button type="submit" disabled={busy} style={{
              background: C.blue, color: "#fff", border: 0, borderRadius: "20px",
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
  borderTop: `1px solid ${C.hairline}`, marginTop: "14px", paddingTop: "8px",
};

const box: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: F.ui, fontSize: "15px", color: C.ink,
  background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "12px",
  padding: "10px 12px",
};

const outlined: React.CSSProperties = {
  background: "#fff", color: C.blue, border: `1.5px solid ${C.outline}`,
  borderRadius: "9px", padding: "8px 12px",
  font: "600 13px/1 var(--font-outfit)", cursor: "pointer",
};

const plain: React.CSSProperties = {
  background: "transparent", border: 0, padding: "8px 0", color: C.blue,
  font: "600 13px/1 var(--font-outfit)", cursor: "pointer",
};

const plainGrey: React.CSSProperties = {
  background: "transparent", border: 0, borderRadius: "9px", padding: "8px 10px 8px 0",
  color: C.muted, font: "500 13px/1 var(--font-outfit)", cursor: "pointer",
};

const monoFaint: React.CSSProperties = {
  font: "500 10.5px/1 var(--font-mono)", letterSpacing: ".08em",
  textTransform: "uppercase", color: C.faint,
};

const bubbleMine: React.CSSProperties = {
  alignSelf: "flex-end", maxWidth: "82%", background: C.blue, color: "#fff",
  borderRadius: "14px 14px 4px 14px", padding: "8px 11px",
  font: "400 14.5px/1.4 var(--font-newsreader)", whiteSpace: "pre-wrap", wordBreak: "break-word",
};

const bubbleTheirs: React.CSSProperties = {
  alignSelf: "flex-start", maxWidth: "82%", background: "#fff",
  border: `1px solid ${C.hairline}`, borderRadius: "14px 14px 14px 4px",
  padding: "8px 11px", color: C.ink,
  font: "400 14.5px/1.4 var(--font-newsreader)", whiteSpace: "pre-wrap", wordBreak: "break-word",
};
