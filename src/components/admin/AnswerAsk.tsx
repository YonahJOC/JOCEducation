"use client";

import { useState, useTransition } from "react";
import { answerAsk } from "@/app/actions/ask";
import { C, R, F, primaryButton, secondaryButton } from "@/lib/joc-tokens";

/**
 * A coordinator closing off a question a school asked (5e, console side).
 *
 * The answer itself happens on the phone. This records that it did, and takes
 * the one or two lines the coordinator is willing to have the school read
 * back — which is the only thing the school ever sees of this.
 *
 * Marking it answered with nothing written is allowed: sometimes the answer
 * genuinely was a phone call. The school's Today page then shows nothing,
 * rather than a row that says "answered" and tells them nothing.
 */
export function AnswerAsk({ askId }: { askId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span style={{ fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.greenText }}>
        Marked answered
      </span>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ ...primaryButton, cursor: "pointer" }}>
        Mark it answered
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          const res = await answerAsk(askId, fd);
          if (res.ok) setDone(true);
        })
      }
      style={{ display: "grid", gap: "8px" }}
    >
      <textarea
        name="reply"
        rows={3}
        placeholder="What they should see back (optional)"
        style={{
          width: "100%", boxSizing: "border-box", fontFamily: F.read, fontSize: "14px",
          lineHeight: 1.5, color: C.ink, backgroundColor: C.white,
          border: `1px solid ${C.hairline}`, borderRadius: R.form, padding: "8px 10px",
          resize: "vertical",
        }}
      />
      <button
        type="submit"
        disabled={pending}
        style={{ ...primaryButton, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Saving…" : "Done"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ ...secondaryButton, cursor: "pointer" }}
      >
        Not yet
      </button>
    </form>
  );
}
