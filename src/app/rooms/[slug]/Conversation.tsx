"use client";

import { useState, useTransition, useRef } from "react";
import { postMessage, removeMessage } from "@/app/actions/rooms";

const INK = "#10233F";
const BLUE = "#2D46AF";
const RED = "#A3261A";

export type Msg = {
  id: string;
  body: string;
  author: string;
  authorSchool: string | null;
  initial: string;
  when: string;
  mine: boolean;
  removed: boolean;
  removedBy: string | null;
  replies: Msg[];
};

const box: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-outfit)",
  fontSize: "15px", lineHeight: 1.55, color: INK, backgroundColor: "#fff",
  border: "1px solid rgba(16,35,63,.18)", borderRadius: "14px",
  padding: "13px 15px", outline: "none", resize: "vertical",
};

export function Conversation({
  roomId, messages, canPost, closed,
}: {
  roomId: string;
  messages: Msg[];
  canPost: boolean;
  closed: boolean;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const composer = useRef<HTMLTextAreaElement>(null);

  function send() {
    if (!body.trim()) return;
    setError(null);
    start(async () => {
      const r = await postMessage({ roomId, body });
      if (r.ok) { setBody(""); composer.current?.focus(); }
      else setError(r.error);
    });
  }

  return (
    <>
      {canPost && !closed && (
        <div style={{ marginBottom: "28px" }}>
          <textarea
            ref={composer}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter makes a new line.
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={3}
            placeholder="Ask the question you would ask in the staffroom…"
            style={box}
          />
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "10px", flexWrap: "wrap" }}>
            <button
              onClick={send}
              disabled={pending || !body.trim()}
              style={{
                fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "14.5px",
                color: "#fff", backgroundColor: BLUE, border: "none",
                borderRadius: "9999px", padding: "12px 24px", minHeight: "46px",
                cursor: pending || !body.trim() ? "default" : "pointer",
                opacity: pending || !body.trim() ? 0.5 : 1,
              }}
            >
              {pending ? "Posting…" : "Post"}
            </button>
            <span style={{ fontSize: "12.5px", color: "#4A5A74" }}>
              Enter posts · Shift + Enter for a new line
            </span>
          </div>
          {error && <p style={{ fontSize: "13.5px", color: RED, margin: "8px 0 0" }}>{error}</p>}
        </div>
      )}

      {closed && (
        <p style={{ fontSize: "14.5px", color: "#4A5A74", backgroundColor: "#F4F7FD", borderRadius: "14px", padding: "14px 18px", marginBottom: "28px" }}>
          This room is closed to new messages. Everything in it stays readable.
        </p>
      )}

      {messages.length === 0 ? (
        <p style={{ fontSize: "15.5px", color: "#4A5A74", textAlign: "center", padding: "48px 0" }}>
          Nothing here yet. Whatever you are wondering about, someone else is too.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {messages.map((m) => (
            <Message key={m.id} message={m} roomId={roomId} canPost={canPost && !closed} />
          ))}
        </div>
      )}
    </>
  );
}

function Message({ message: m, roomId, canPost }: { message: Msg; roomId: string; canPost: boolean }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [gone, setGone] = useState(m.removed);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function sendReply() {
    if (!reply.trim()) return;
    setError(null);
    start(async () => {
      const r = await postMessage({ roomId, body: reply, parentId: m.id });
      if (r.ok) { setReply(""); setReplying(false); }
      else setError(r.error);
    });
  }

  function remove() {
    if (!window.confirm("Remove this message?")) return;
    start(async () => {
      const r = await removeMessage(m.id);
      if (r.ok) setGone(true);
      else setError(r.error);
    });
  }

  return (
    <div>
      <Bubble message={m} removed={gone} onRemove={remove} canRemove={m.mine} />

      {(m.replies.length > 0 || replying) && (
        <div style={{ marginLeft: "20px", paddingLeft: "20px", borderLeft: "2px solid rgba(16,35,63,.08)", marginTop: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {m.replies.map((r) => (
            <ReplyBubble key={r.id} message={r} />
          ))}

          {replying && (
            <div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                rows={2}
                placeholder={`Reply to ${m.author}…`}
                autoFocus
                style={{ ...box, fontSize: "14.5px" }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  onClick={sendReply}
                  disabled={pending || !reply.trim()}
                  style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: "13.5px", color: "#fff", backgroundColor: BLUE, border: "none", borderRadius: "9999px", padding: "10px 20px", minHeight: "42px", cursor: "pointer", opacity: pending || !reply.trim() ? 0.5 : 1 }}
                >
                  {pending ? "Posting…" : "Reply"}
                </button>
                <button
                  onClick={() => { setReplying(false); setReply(""); }}
                  style={{ fontFamily: "var(--font-outfit)", fontWeight: 600, fontSize: "13.5px", color: "#4A5A74", background: "none", border: "none", cursor: "pointer", minHeight: "42px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canPost && !replying && !gone && (
        <button
          onClick={() => setReplying(true)}
          style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: BLUE, background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", marginLeft: m.replies.length > 0 ? "40px" : "52px", minHeight: "40px" }}
        >
          Reply
        </button>
      )}

      {error && <p style={{ fontSize: "12.5px", color: RED, margin: "6px 0 0", marginLeft: "52px" }}>{error}</p>}
    </div>
  );
}

function Bubble({
  message: m, removed, onRemove, canRemove,
}: {
  message: Msg;
  removed: boolean;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
      <Avatar initial={m.initial} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "baseline", flexWrap: "wrap", marginBottom: "3px" }}>
          <span style={{ fontWeight: 700, fontSize: "14.5px", color: INK }}>{m.author}</span>
          {m.authorSchool && (
            <span style={{ fontSize: "12.5px", color: "#4A5A74" }}>{m.authorSchool}</span>
          )}
          <span style={{ fontSize: "12.5px", color: "#4A5A74" }}>{m.when}</span>
          {canRemove && !removed && (
            <button
              onClick={onRemove}
              style={{ marginLeft: "auto", fontFamily: "var(--font-outfit)", fontSize: "12px", fontWeight: 600, color: "#4A5A74", background: "none", border: "none", cursor: "pointer", minHeight: "32px" }}
            >
              Remove
            </button>
          )}
        </div>
        {removed ? (
          <p style={{ fontSize: "14.5px", color: "#4A5A74", fontStyle: "italic", margin: 0 }}>
            {m.removedBy === "moderator" ? "Removed by the JOC team." : "Removed."}
          </p>
        ) : (
          <p style={{ fontSize: "15px", color: "rgba(16,35,63,.85)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
            {m.body}
          </p>
        )}
      </div>
    </div>
  );
}

function ReplyBubble({ message: m }: { message: Msg }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <Avatar initial={m.initial} small />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", gap: "9px", alignItems: "baseline", flexWrap: "wrap", marginBottom: "2px" }}>
          <span style={{ fontWeight: 700, fontSize: "13.5px", color: INK }}>{m.author}</span>
          <span style={{ fontSize: "12px", color: "#4A5A74" }}>{m.when}</span>
        </div>
        {m.removed ? (
          <p style={{ fontSize: "14px", color: "#4A5A74", fontStyle: "italic", margin: 0 }}>Removed.</p>
        ) : (
          <p style={{ fontSize: "14.5px", color: "rgba(16,35,63,.82)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
            {m.body}
          </p>
        )}
      </div>
    </div>
  );
}

function Avatar({ initial, small }: { initial: string; small?: boolean }) {
  const size = small ? 30 : 38;
  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`, height: `${size}px`, borderRadius: "9999px",
        backgroundColor: "#F4F7FD", color: BLUE, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
        fontWeight: 700, fontSize: small ? "13px" : "15px",
      }}
    >
      {initial}
    </span>
  );
}
