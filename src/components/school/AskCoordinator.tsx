"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { writeToJOC } from "@/app/actions/school-messages";
import { C, R, F, label, primaryButton, secondaryButton } from "@/lib/joc-tokens";

/**
 * Asking about one program, from its own page.
 *
 * It used to file a separate thing: a question with a chip, one reply, living
 * in its own table. A school that asked here and then wrote in the thread had
 * two conversations neither side could see whole.
 *
 * It is a message with a topic on it now. Same conversation, same inbox, same
 * history — the chip survives as a label above the message so a coordinator
 * still sees what it was about.
 */

/** When nothing has been written for a program, these are the chips. */
const FALLBACK_TOPICS = ["A date", "The kit", "A meeting", "Something else"];

export function AskCoordinator({
  programId, coordinator, topics,
}: {
  programId: number | null;
  coordinator?: string | null;
  /** The program's own chips. Empty falls back to a general set. */
  topics?: string[];
}) {
  const chips = topics && topics.length > 0 ? topics : FALLBACK_TOPICS;

  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string>(chips[0]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const box = useRef<HTMLTextAreaElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  const who = coordinator ?? "JOC";

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = () => {
    const text = body.trim();
    if (text.length < 2) { setError("Write a line or two and we'll pass it on."); return; }

    start(async () => {
      const form = new FormData();
      form.set("body", text);
      form.set("topic", topic);
      const res = await writeToJOC(programId, null, form);
      if (!res.ok) { setError(res.error); return; }

      setSent(true);
      setError(null);
      setBody("");
      // It lands in the conversation further down this page, so go and show
      // them rather than leaving a sheet saying it went somewhere.
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        document.getElementById("messages")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 1400);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...secondaryButton, cursor: "pointer", width: "100%" }}
      >
        Ask {who} something
      </button>
    );
  }

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(16,35,63,.44)", zIndex: 90 }}
      />

      <div role="dialog" aria-modal="true" aria-label={`Ask ${who} something`} className="joc-sheet">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...label, color: C.blue, margin: "0 0 4px" }}>Ask a question</p>
            <h2 style={{
              fontFamily: F.ui, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em",
              color: C.ink, margin: 0, lineHeight: 1.2,
            }}>
              {coordinator ? `Ask ${coordinator} something` : "Ask JOC something"}
            </h2>
          </div>
          <button
            ref={first}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              fontFamily: F.data, fontSize: "13px", color: C.muted, background: "none",
              border: "none", cursor: "pointer", minHeight: "44px", minWidth: "44px",
            }}
          >
            CLOSE
          </button>
        </div>

        {sent ? (
          <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.greenText, margin: 0 }}>
            That&rsquo;s with {who}, in the conversation below.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              {chips.map((t) => {
                const on = t === topic;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTopic(t); box.current?.focus(); }}
                    aria-pressed={on}
                    style={{
                      fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                      color: on ? C.white : C.ink,
                      backgroundColor: on ? C.ink : C.white,
                      border: on ? "none" : `1px solid ${C.hairline}`,
                      borderRadius: "999px", padding: "0 16px", minHeight: "44px", cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <textarea
              ref={box}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What would you like to know?"
              style={{
                width: "100%", boxSizing: "border-box", fontFamily: F.read, fontSize: "16px",
                lineHeight: 1.55, color: C.ink, backgroundColor: C.white,
                border: `1px solid ${C.hairline}`, borderRadius: R.form,
                padding: "12px 14px", resize: "vertical", marginBottom: "14px",
              }}
            />

            {error && (
              <p style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, margin: "0 0 12px" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={pending}
              style={{ ...primaryButton, width: "100%", cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Sending…" : `Send it to ${who}`}
            </button>

            <p style={{ fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, color: C.muted, margin: "10px 0 0" }}>
              <strong style={{ color: C.ink }}>No email is sent.</strong>{" "}
              {coordinator
                ? `${coordinator} sees it on their console, and it appears in the conversation on this page.`
                : "It appears in the conversation on this page."}
            </p>
          </>
        )}
      </div>
    </>
  );
}
