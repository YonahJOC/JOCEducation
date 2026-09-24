"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { askCoordinator, type AskResult } from "@/app/actions/ask";
import { TOPICS } from "@/lib/ask-topics";
import { C, R, F, label, primaryButton, secondaryButton } from "@/lib/joc-tokens";

/**
 * "Ask <coordinator> something" (5e).
 *
 * A sheet rather than a page, because the question is nearly always about
 * what is already on the screen behind it. Three chips, a box and one
 * button — and the line under the button says exactly what happens next,
 * which is that somebody reads it on their console. It does not say we will
 * email you, because we will not.
 */

export function AskCoordinator({
  programId, coordinator,
}: {
  programId: number | null;
  /** First name, or null when nobody is down as running it. */
  coordinator: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const box = useRef<HTMLTextAreaElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  const bound = askCoordinator.bind(null, programId);
  const [state, action, pending] = useActionState<AskResult | null, FormData>(bound, null);

  const who = coordinator ?? "your coordinator";

  // Escape closes it, and focus starts inside it — a sheet that traps neither
  // is a sheet somebody using a keyboard cannot leave.
  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => setOpen(false), 2200);
      return () => clearTimeout(t);
    }
  }, [state]);

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
        style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(16,35,63,.44)",
          zIndex: 90,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ask ${who} something`}
        className="joc-sheet"
      >
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

        {state?.ok ? (
          <p style={{ fontFamily: F.read, fontSize: "17px", lineHeight: 1.6, color: C.greenText, margin: 0 }}>
            That&rsquo;s with {who}. Nothing else is needed from you.
          </p>
        ) : (
          <form action={action}>
            <input type="hidden" name="topic" value={topic} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              {TOPICS.map((t) => {
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
                      borderRadius: "999px", padding: "0 16px", minHeight: "44px",
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <textarea
              ref={box}
              name="body"
              rows={5}
              required
              placeholder="What would you like to know?"
              style={{
                width: "100%", boxSizing: "border-box", fontFamily: F.read, fontSize: "16px",
                lineHeight: 1.55, color: C.ink, backgroundColor: C.white,
                border: `1px solid ${C.hairline}`, borderRadius: R.form,
                padding: "12px 14px", resize: "vertical", marginBottom: "14px",
              }}
            />

            {state && !state.ok && (
              <p style={{ fontFamily: F.read, fontSize: "15px", color: C.orangeText, margin: "0 0 12px" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{ ...primaryButton, width: "100%", cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Saving…" : `Leave it for ${who}`}
            </button>

            <p style={{ fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, color: C.muted, margin: "10px 0 0" }}>
              {coordinator
                ? `${coordinator} sees it on their console the next time they open it.`
                : "Whoever runs this program sees it on their console the next time they open it."}
            </p>
          </form>
        )}
      </div>
    </>
  );
}
