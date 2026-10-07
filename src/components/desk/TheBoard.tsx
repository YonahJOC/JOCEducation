"use client";

import { useState, useTransition } from "react";
import { readNotice, pinNotice, unpinNotice } from "@/app/actions/desk";
import type { Notice } from "@/lib/desk";
import { C, F } from "@/lib/joc-tokens";

/**
 * The board — what one team needs everybody to know.
 *
 * Not a feed. Things are pinned rarely, read once, and come down on their own
 * date; a board nobody clears is a wall of last term. When everything on it
 * has been read it collapses to a single line, because a board you have read
 * is not news.
 */

export function TheBoard({
  notices, canPin,
}: {
  notices: Notice[];
  canPin: boolean;
}) {
  const [list, setList] = useState(notices);
  const [composing, setComposing] = useState(false);
  const [dept, setDept] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const unread = list.filter((n) => !n.read);

  const markRead = (id: string) => {
    setList((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)));
    start(async () => { await readNotice(id); });
  };

  return (
    <div style={{ flex: "1 1 300px", maxWidth: "380px", minWidth: 0 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        gap: "10px", marginBottom: "12px",
      }}>
        <h2 style={h2}>The board</h2>
        {canPin && !composing && (
          <button type="button" onClick={() => setComposing(true)} style={textLink}>
            Pin a notice
          </button>
        )}
      </div>

      {composing && (
        <form
          action={() => {
            setError(null);
            start(async () => {
              const res = await pinNotice(dept, title, body, 1);
              if (!res.ok) { setError(res.error); return; }
              setList((l) => [
                { id: `pending-${Date.now()}`, dept: (dept || "JOC").toUpperCase(), title, body, author: "you", ago: "today", read: true },
                ...l,
              ]);
              setDept(""); setTitle(""); setBody(""); setComposing(false);
            });
          }}
          style={{ ...card, marginBottom: "10px", display: "grid", gap: "8px" }}
        >
          <input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Which team? e.g. Finance" style={field} />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline" maxLength={60} style={field} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="One sentence" style={{ ...field, resize: "vertical", fontFamily: F.read }} />
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" style={primary}>Pin to board</button>
            <button type="button" onClick={() => setComposing(false)} style={quiet}>Cancel</button>
            <span style={{ ...mono, color: C.faint }}>Comes down in a week</span>
          </div>
          {error && <p style={{ ...mono, color: C.orangeText, margin: 0 }}>{error}</p>}
        </form>
      )}

      {list.length === 0 ? (
        <div style={card}>
          <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted, margin: 0 }}>
            Nothing pinned. Teams post here when something changes for everyone.
          </p>
        </div>
      ) : unread.length === 0 ? (
        <div style={{ ...card, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.read, fontSize: "15px", color: C.muted }}>
            You&rsquo;ve read everything pinned.
          </span>
          <span style={{ ...mono, color: C.faint }}>{list.length} up</span>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {unread.slice(0, 3).map((n) => (
            <article key={n.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span aria-hidden="true" style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  backgroundColor: C.blue, flex: "0 0 auto",
                }} />
                <span style={{ ...mono, color: C.blue }}>{n.dept}</span>
                <span style={{ ...mono, color: C.faint }}>{n.ago}</span>
              </div>

              <p style={{
                fontFamily: F.ui, fontSize: "16px", fontWeight: 600, lineHeight: 1.3,
                color: C.ink, margin: "0 0 4px",
              }}>
                {n.title}
              </p>

              {n.body && (
                <p style={{
                  fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted,
                  margin: "0 0 8px",
                }}>
                  {n.body}
                </p>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ ...mono, color: C.faint }}>{n.author}</span>
                <button type="button" onClick={() => markRead(n.id)} style={textLink}>Got it</button>
                {canPin && (
                  <button
                    type="button"
                    onClick={() => {
                      setList((l) => l.filter((x) => x.id !== n.id));
                      start(async () => { await unpinNotice(n.id); });
                    }}
                    style={{ ...textLink, color: C.destructive }}
                  >
                    Take down
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  backgroundColor: C.white, borderRadius: "14px", padding: "14px 16px",
  boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
};

const h2: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "19px", fontWeight: 600, letterSpacing: "-0.01em",
  color: C.ink, margin: 0,
};

const mono: React.CSSProperties = {
  fontFamily: F.data, fontSize: "10.5px", fontWeight: 600,
  letterSpacing: "0.08em", textTransform: "uppercase", margin: 0,
};

const textLink: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
  background: "none", border: "none", cursor: "pointer", padding: 0,
};

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: F.ui, fontSize: "15px", color: C.ink, backgroundColor: C.white,
  border: `1px solid ${C.hairline}`, borderRadius: "10px",
  padding: "10px 12px", minHeight: "42px",
};

const primary: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.white,
  backgroundColor: C.blue, border: "none", borderRadius: "10px",
  padding: "11px 16px", cursor: "pointer",
};

const quiet: React.CSSProperties = {
  fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.muted,
  background: "none", border: "none", cursor: "pointer", padding: "11px 4px",
};
