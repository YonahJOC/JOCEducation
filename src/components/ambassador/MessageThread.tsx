"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { C, F, R, T, HIT } from "@/lib/joc-tokens";
import { sendAmbassadorMessage, seenAmbassadorMessages } from "@/app/actions/ambassador-messages";
import type { AmbassadorMessage } from "@/lib/ambassador-messages";

/**
 * One conversation, between a student and their teacher.
 *
 * Written in the reading face, because a person wrote it. The student's
 * own words sit on the right in blue and the teacher's on the left in
 * white, which is the arrangement every messaging app on their phone
 * already taught them.
 */
export function MessageThread({
  ambassadorId, messages, teacherName, closed,
}: {
  ambassadorId: string;
  messages: AmbassadorMessage[];
  teacherName: string;
  /** A finished tenure: readable, not writable. */
  closed?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const foot = useRef<HTMLDivElement>(null);

  // Opening the page is what "seen" means. No tick to press: asking
  // somebody to press one is asking them to do the bookkeeping.
  useEffect(() => {
    void seenAmbassadorMessages(ambassadorId);
  }, [ambassadorId]);

  useEffect(() => {
    foot.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const body = text.trim();
    if (body.length < 2) { setError("Write something first."); return; }
    setError(null);
    start(async () => {
      const res = await sendAmbassadorMessage(ambassadorId, body);
      if (!res.ok) { setError(res.error); return; }
      setText("");
      router.refresh();
    });
  }

  return (
    <section style={{
      background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <header style={{ padding: "15px 18px", borderBottom: `1px solid ${C.rule}` }}>
        <p style={{ fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink, margin: 0 }}>
          {teacherName}
        </p>
        <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "2px 0 0" }}>
          Your teacher. Nobody else at your school reads this.
        </p>
      </header>

      <div style={{ padding: "18px", display: "grid", gap: "14px", background: C.paper }}>
        {messages.length === 0 ? (
          <p style={{ ...T.read, color: C.muted, margin: 0, textAlign: "center", padding: "18px 0" }}>
            Nothing yet. Ask {teacherName.split(/\s+/).slice(-1)[0]} anything about the screen —
            why something was set aside, what to put up next, whatever you need.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                justifySelf: m.fromStudent ? "end" : "start",
                maxWidth: "min(520px, 86%)",
              }}
            >
              <div style={{
                background: m.fromStudent ? C.blue : C.white,
                color: m.fromStudent ? C.white : C.ink,
                border: m.fromStudent ? "none" : `1px solid ${C.hairline}`,
                borderRadius: m.fromStudent ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
                padding: "12px 16px",
              }}>
                <p style={{ ...T.read, margin: 0, whiteSpace: "pre-wrap", color: "inherit" }}>{m.body}</p>
              </div>
              <p style={{
                ...T.meta, margin: "5px 4px 0",
                textAlign: m.fromStudent ? "right" : "left",
              }}>
                {(m.fromStudent ? "YOU" : (m.authorName ?? teacherName).toUpperCase())}
                {" · "}
                {new Date(m.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          ))
        )}
        <div ref={foot} />
      </div>

      <div style={{ borderTop: `1px solid ${C.rule}`, padding: "14px 18px 18px", background: C.white }}>
        {closed ? (
          <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: 0 }}>
            Your time running this has finished, so nothing new can be added. Everything here stays.
          </p>
        ) : (
          <>
            <label htmlFor="amb-msg" style={{ ...T.meta, display: "block", marginBottom: "6px" }}>
              WRITE TO {teacherName.toUpperCase()}
            </label>
            <textarea
              id="amb-msg"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1500}
              placeholder="Ask anything about the screen."
              style={{
                width: "100%", boxSizing: "border-box", resize: "vertical",
                fontFamily: F.ui, fontSize: "16px", color: C.ink, background: C.white,
                border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "11px 13px",
                lineHeight: 1.5,
              }}
            />
            {error ? <p role="alert" style={{ ...T.small, color: C.redText, margin: "8px 0 0" }}>{error}</p> : null}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "11px" }}>
              <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: 0, flex: "1 1 220px", minWidth: 0 }}>
                They see it next time they open their screen page.
              </p>
              <button
                type="button"
                onClick={send}
                disabled={pending}
                style={{
                  minHeight: HIT, padding: "0 22px", border: 0, borderRadius: R.button,
                  background: C.blue, color: C.white, cursor: pending ? "default" : "pointer",
                  opacity: pending ? 0.6 : 1,
                  fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
                }}
              >
                {pending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
