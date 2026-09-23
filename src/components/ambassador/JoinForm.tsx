"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinWithCode } from "@/app/actions/ambassadors";
import { C, R, ROW_SHADOW, primaryButton } from "@/lib/joc-tokens";

/**
 * Entering a join code.
 *
 * Six characters, typed off a whiteboard. Uppercased as they go so a student
 * who types lowercase never sees a refusal they did not earn, and spaced out
 * large enough to check against what the teacher wrote.
 */

export function JoinForm() {
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();

  if (done) {
    return (
      <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "28px 24px" }}>
        <p style={{ fontFamily: "var(--font-outfit)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", color: C.ink, margin: "0 0 8px" }}>
          You&rsquo;re in
        </p>
        <p style={{ fontSize: "16px", color: C.muted, margin: "0 0 18px", lineHeight: 1.6 }}>{done}</p>
        <button
          type="button"
          onClick={() => router.push("/ambassador")}
          style={{ ...primaryButton, width: "auto" }}
        >
          Go to your program
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-outfit)", fontSize: "clamp(28px, 6vw, 38px)", fontWeight: 800, letterSpacing: "-0.03em", color: C.ink, margin: "0 0 8px", lineHeight: 1.1 }}>
        Enter your code
      </h1>
      <p style={{ fontSize: "16px", color: C.muted, lineHeight: 1.6, margin: "0 0 22px", maxWidth: "48ch" }}>
        Your teacher will have given you six letters and numbers. It only works for the one program
        you are running, at your own school.
      </p>

      <div style={{ backgroundColor: C.white, borderRadius: R.row, boxShadow: ROW_SHADOW, padding: "22px 20px", maxWidth: "440px" }}>
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 6)); setErr(null); }}
          placeholder="ABC123"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Your six-character code"
          style={{
            fontFamily: "var(--font-outfit)", fontSize: "34px", fontWeight: 800,
            letterSpacing: "0.22em", textAlign: "center", color: C.ink,
            backgroundColor: C.panel, border: `2px solid ${err ? C.red : C.hairline}`,
            borderRadius: R.form, padding: "16px 12px", width: "100%", boxSizing: "border-box",
            textTransform: "uppercase",
          }}
        />
        <button
          type="button"
          disabled={pending || code.length !== 6}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await joinWithCode(code);
              if (r.ok) setDone(r.message);
              else setErr(r.error);
            });
          }}
          style={{ ...primaryButton, marginTop: "14px", opacity: code.length === 6 ? 1 : 0.5 }}
        >
          {pending ? "Checking…" : "Join"}
        </button>

        {err && (
          <p role="alert" style={{ fontSize: "15px", color: C.redText, margin: "12px 0 0", lineHeight: 1.55 }}>
            {err}
          </p>
        )}
      </div>

      <p style={{ fontSize: "14px", color: C.muted, lineHeight: 1.6, margin: "18px 0 0", maxWidth: "52ch" }}>
        Haven&rsquo;t got a code? Ask the teacher who runs the program at your school. JOC never
        emails students — the code only ever comes from them.
      </p>
    </div>
  );
}
