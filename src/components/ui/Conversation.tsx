"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { C, F, label } from "@/lib/joc-tokens";

/**
 * One running conversation, newest at the bottom.
 *
 * Both sides use it: a coordinator and a school looking at the same exchange
 * should see the same exchange, mirrored only in which bubbles sit on the
 * right. `mine` is the only thing that differs.
 *
 * The one line that must never be missed sits under the composer in bold:
 * **No email is sent.** Everything else here is ordinary messaging furniture;
 * that sentence is the thing somebody has to believe before they understand
 * what pressing Send does.
 */

export type ThreadMessage = {
  id: string;
  body: string;
  topic?: string | null;
  inbound: boolean;
  author: string | null;
  sentAt: Date;
  seenAt?: Date | null;
};

const dayStamp = (d: Date) => new Date(d).toDateString();

function dayLabel(d: Date): string {
  const k = dayStamp(d);
  if (k === new Date().toDateString()) return "Today";
  if (k === new Date(Date.now() - 86_400_000).toDateString()) return "Yesterday";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long",
  });
}

const clock = (d: Date) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();

export function Conversation({
  messages, mine, send, placeholder, readerName, starters, beforeComposer, noteAfter,
}: {
  messages: ThreadMessage[];
  /** Whose side the reader is on. Their own words sit on the right. */
  mine: "school" | "joc";
  send: (body: string) => Promise<string | null>;
  placeholder: string;
  /** The person on the other end, for the status line and the empty state. */
  readerName: string;
  /** Questions that fill the composer when clicked. They do not send. */
  starters?: string[];
  /** A warning that belongs above the box rather than under it. */
  beforeComposer?: React.ReactNode;
  /** What follows "No email is sent." */
  noteAfter: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // Where the unread run begins, frozen on mount: the divider must not jump
  // as things are marked read underneath it.
  const [firstUnread] = useState(
    () => messages.find((m) => (mine === "school" ? !m.inbound : m.inbound) && m.seenAt == null)?.id ?? null,
  );

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
      if (err) { setError(err); return; }
      setError(null);
      setDraft("");
      requestAnimationFrame(grow);
    });
  };

  const days: { key: string; at: Date; items: ThreadMessage[] }[] = [];
  for (const m of messages) {
    const k = dayStamp(m.sentAt);
    const last = days[days.length - 1];
    if (last && last.key === k) last.items.push(m);
    else days.push({ key: k, at: m.sentAt, items: [m] });
  }

  const latest = messages[messages.length - 1] ?? null;
  const isMine = (m: ThreadMessage) => (mine === "school" ? m.inbound : !m.inbound);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="joc-conversation">
        {messages.length === 0 ? (
          <Empty readerName={readerName} starters={starters} onPick={(q) => {
            setDraft(q);
            requestAnimationFrame(() => { grow(); box.current?.focus(); });
          }} />
        ) : (
          <>
            {days.map((d) => (
              <div key={d.key}>
                <p style={{ ...label, color: C.muted, textAlign: "center", margin: "10px 0 14px" }}>
                  {dayLabel(d.at)}
                </p>

                {d.items.map((m, i) => {
                  const own = isMine(m);
                  const prev = d.items[i - 1];
                  const startsRun = !prev || prev.inbound !== m.inbound;

                  return (
                    <div key={m.id}>
                      {m.id === firstUnread && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: "10px", margin: "14px 2px 10px",
                        }}>
                          <span style={{ flex: 1, height: "1px", backgroundColor: C.orange }} />
                          <span style={{ ...label, color: C.orangeText }}>
                            New since you last looked
                          </span>
                          <span style={{ flex: 1, height: "1px", backgroundColor: C.orange }} />
                        </div>
                      )}

                      <div style={{
                        display: "flex",
                        justifyContent: own ? "flex-end" : "flex-start",
                        marginTop: startsRun ? "12px" : "3px",
                      }}>
                        <div style={{ maxWidth: "min(78%, 46ch)", minWidth: 0 }}>
                          {startsRun && !own && (
                            <p style={{ ...label, color: C.muted, margin: "0 0 4px", paddingLeft: "4px" }}>
                              {m.author ?? (m.inbound ? "The school" : "JOC")}
                            </p>
                          )}

                          {m.topic && (
                            <p style={{
                              ...label, color: C.muted, margin: "0 0 5px",
                              paddingLeft: own ? 0 : "4px", textAlign: own ? "right" : "left",
                            }}>
                              Asked from the program page · {m.topic}
                            </p>
                          )}

                          <div style={{
                            backgroundColor: own ? C.blue : C.white,
                            color: own ? C.white : C.ink,
                            border: own ? "none" : `1px solid ${C.hairline}`,
                            borderRadius: "16px",
                            borderBottomRightRadius: own ? "5px" : "16px",
                            borderBottomLeftRadius: own ? "16px" : "5px",
                            padding: "10px 14px",
                          }}>
                            <p style={{
                              fontFamily: F.read, fontSize: "16px", lineHeight: 1.5, margin: 0,
                              whiteSpace: "pre-wrap", wordBreak: "break-word",
                            }}>
                              {m.body}
                            </p>
                          </div>

                          <p style={{
                            fontSize: "11px", color: C.muted, margin: "3px 4px 0",
                            textAlign: own ? "right" : "left",
                          }}>
                            {clock(m.sentAt)}
                            {own && m.seenAt != null && " · Read"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* When the last word is yours, say where it got to rather than
                leaving the thread looking unanswered for no reason. */}
            {latest && isMine(latest) && (
              <p style={{
                fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, color: C.muted,
                textAlign: "center", margin: "14px 10px 4px",
              }}>
                {latest.seenAt
                  ? `Read by ${readerName}, ${dayLabel(latest.seenAt).toLowerCase()} ${clock(latest.seenAt)}. No reply yet.`
                  : `Not opened yet. ${readerName} sees it next time they open the console.`}
              </p>
            )}
          </>
        )}
        <div ref={end} />
      </div>

      {beforeComposer}

      <div style={{ marginTop: "12px" }}>
        <div className="joc-composer">
          <textarea
            ref={box}
            rows={1}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => { setDraft(e.target.value); grow(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            style={{
              flex: 1, minWidth: 0, resize: "none", border: "none",
              background: "transparent", fontFamily: F.read, fontSize: "16px",
              lineHeight: 1.5, color: C.ink, padding: "10px 0", maxHeight: "160px",
            }}
          />

          <button
            type="button"
            onClick={submit}
            disabled={pending || draft.trim().length === 0}
            style={{
              flexShrink: 0, alignSelf: "flex-end",
              fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
              minHeight: "44px", padding: "0 20px", borderRadius: "12px",
              cursor: draft.trim() ? "pointer" : "default",
              backgroundColor: draft.trim() ? C.blue : "transparent",
              color: draft.trim() ? C.white : C.blue,
              border: draft.trim() ? "none" : `2px solid ${C.blue}`,
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>

        <p className="joc-enter-hint" style={{ fontSize: "12px", color: C.muted, margin: "6px 2px 0" }}>
          Enter sends · Shift + Enter for a new line
        </p>

        {error && (
          <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "8px 0 0" }}>
            {error}
          </p>
        )}

        <p style={{ fontFamily: F.read, fontSize: "14px", color: C.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
          <strong style={{ color: C.ink }}>No email is sent.</strong> {noteAfter}
        </p>
      </div>
    </div>
  );
}

/**
 * Nothing written yet.
 *
 * Names the person, then offers three things somebody might actually ask.
 * The starters fill the box and stop there — a question nobody read before it
 * sent is not a question they meant.
 */
function Empty({
  readerName, starters, onPick,
}: {
  readerName: string;
  starters?: string[];
  onPick: (q: string) => void;
}) {
  const initials = readerName
    .split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div style={{
      margin: "auto", textAlign: "center", padding: "22px 16px", maxWidth: "46ch",
    }}>
      <span aria-hidden="true" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "64px", height: "64px", borderRadius: "50%",
        backgroundColor: C.panel, color: C.blue,
        fontFamily: F.ui, fontSize: "22px", fontWeight: 700, marginBottom: "12px",
      }}>
        {initials || "JOC"}
      </span>

      <p style={{
        fontFamily: F.ui, fontSize: "20px", fontWeight: 700, color: C.ink, margin: "0 0 14px",
      }}>
        Write to {readerName}
      </p>

      {starters && starters.length > 0 && (
        <>
          <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>A few ways to start</p>
          <div style={{ display: "grid", gap: "8px" }}>
            {starters.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onPick(q)}
                style={{
                  fontFamily: F.read, fontSize: "15px", lineHeight: 1.45, color: C.ink,
                  backgroundColor: C.white, border: `1px solid ${C.hairline}`,
                  borderRadius: "12px", padding: "11px 14px", minHeight: "44px",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
