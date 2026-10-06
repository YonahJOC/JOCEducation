"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { C, F, label } from "@/lib/joc-tokens";

/**
 * A conversation, the shape everybody already knows one.
 *
 * What was here before was a form: a box, a button, and a list of past
 * entries underneath. Technically a thread, and nothing about it said
 * "somebody will read this and write back" — which is the whole thing a
 * school needs to believe before they will use it.
 *
 * So: bubbles, mine on the right and theirs on the left, grouped under a day
 * so a run of messages reads as one exchange rather than five records. The
 * composer sits at the bottom and stays there. Enter sends, shift-Enter is a
 * new line, because that is what those keys do everywhere else.
 *
 * Used by both sides. A coordinator and a school looking at the same
 * conversation should see the same conversation.
 */

export type Message = {
  id: string;
  body: string;
  /** True when the school wrote it. */
  inbound: boolean;
  author: string | null;
  sentAt: Date;
  seenAt?: Date | null;
};

const dayKey = (d: Date) => new Date(d).toDateString();

function dayLabel(d: Date): string {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const k = new Date(d).toDateString();
  if (k === today) return "Today";
  if (k === yesterday) return "Yesterday";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long",
  });
}

const time = (d: Date) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function Conversation({
  messages, mine, send, placeholder, note, disabled, disabledNote,
}: {
  messages: Message[];
  /**
   * Which side the reader is on. "school" puts inbound messages on the right,
   * "joc" puts them on the left — each person's own words sit where their own
   * words sit in every other app they use.
   */
  mine: "school" | "joc";
  /** Returns an error to show, or null when it went. */
  send: (body: string) => Promise<string | null>;
  placeholder: string;
  /** One line under the composer: where this lands. */
  note?: string;
  /** Nothing can be sent, and why. */
  disabled?: boolean;
  disabledNote?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // Newest message in view, the way a conversation opens everywhere.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const grow = () => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const submit = () => {
    const body = draft.trim();
    if (!body || pending) return;
    start(async () => {
      const err = await send(body);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setDraft("");
      requestAnimationFrame(grow);
    });
  };

  // One block per day, and inside it one block per run from the same person.
  const days: { key: string; at: Date; items: Message[] }[] = [];
  for (const m of messages) {
    const k = dayKey(m.sentAt);
    const last = days[days.length - 1];
    if (last && last.key === k) last.items.push(m);
    else days.push({ key: k, at: m.sentAt, items: [m] });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="joc-conversation">
        {messages.length === 0 ? (
          <p style={{
            fontFamily: F.read, fontSize: "15px", lineHeight: 1.6, color: C.muted,
            margin: "auto", textAlign: "center", maxWidth: "40ch", padding: "28px 0",
          }}>
            No messages yet. Whatever you write here starts the conversation.
          </p>
        ) : (
          days.map((d) => (
            <div key={d.key}>
              <p style={{ ...label, color: C.muted, textAlign: "center", margin: "6px 0 14px" }}>
                {dayLabel(d.at)}
              </p>

              {d.items.map((m, i) => {
                const own = mine === "school" ? m.inbound : !m.inbound;
                const prev = d.items[i - 1];
                const startsRun = !prev || prev.inbound !== m.inbound;

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: own ? "flex-end" : "flex-start",
                      marginTop: startsRun ? "12px" : "3px",
                    }}
                  >
                    <div style={{ maxWidth: "min(78%, 46ch)", minWidth: 0 }}>
                      {startsRun && !own && (
                        <p style={{
                          ...label, color: C.muted, margin: "0 0 4px", paddingLeft: "4px",
                        }}>
                          {m.author ?? (m.inbound ? "The school" : "JOC")}
                        </p>
                      )}

                      <div style={{
                        backgroundColor: own ? C.blue : C.white,
                        color: own ? C.white : C.ink,
                        border: own ? "none" : `1px solid ${C.hairline}`,
                        borderRadius: "16px",
                        // The corner nearest the speaker tucks in, which is
                        // what makes a bubble read as coming from a side.
                        borderBottomRightRadius: own ? "5px" : "16px",
                        borderBottomLeftRadius: own ? "16px" : "5px",
                        padding: "10px 14px",
                      }}>
                        <p style={{
                          fontFamily: F.read, fontSize: "15px", lineHeight: 1.5,
                          margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
                        }}>
                          {m.body}
                        </p>
                      </div>

                      <p style={{
                        fontSize: "11px", color: C.muted, margin: "3px 4px 0",
                        textAlign: own ? "right" : "left",
                      }}>
                        {time(m.sentAt)}
                        {own && m.seenAt != null && " · read"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={end} />
      </div>

      {disabled ? (
        <p style={{
          fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, color: C.orangeText,
          margin: "12px 0 0",
        }}>
          {disabledNote ?? "You can't write here."}
        </p>
      ) : (
        <div style={{ marginTop: "12px" }}>
          <div style={{
            display: "flex", gap: "8px", alignItems: "flex-end",
            backgroundColor: C.white, border: `1px solid ${C.hairline}`,
            borderRadius: "22px", padding: "6px 6px 6px 16px",
          }}>
            <textarea
              ref={box}
              rows={1}
              value={draft}
              placeholder={placeholder}
              onChange={(e) => { setDraft(e.target.value); grow(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              style={{
                flex: 1, minWidth: 0, resize: "none", border: "none", outline: "none",
                background: "transparent", fontFamily: F.read, fontSize: "16px",
                lineHeight: 1.5, color: C.ink, padding: "9px 0", maxHeight: "160px",
              }}
            />

            <button
              type="button"
              onClick={submit}
              disabled={pending || draft.trim().length === 0}
              aria-label="Send"
              style={{
                flexShrink: 0,
                width: "44px", height: "44px", borderRadius: "50%",
                border: "none", cursor: draft.trim() ? "pointer" : "default",
                backgroundColor: draft.trim() ? C.blue : C.hairline,
                color: draft.trim() ? C.white : C.muted,
                fontSize: "17px", lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background-color .15s ease",
              }}
            >
              {pending ? "…" : "↑"}
            </button>
          </div>

          {error && (
            <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "8px 0 0" }}>
              {error}
            </p>
          )}
          {note && !error && (
            <p style={{ fontFamily: F.read, fontSize: "13px", color: C.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
