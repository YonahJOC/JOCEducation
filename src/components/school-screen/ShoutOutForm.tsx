"use client";

import { useState, useTransition } from "react";
import { C, F, T } from "@/lib/joc-tokens";
import { submitShoutOut } from "@/app/actions/school-screen";
import { shoutOutFrom } from "@/lib/school-screen/rules";
import { Btn, Field, Note, input } from "./ui";

/**
 * The shout-out itself, on a phone.
 *
 * The name question is a plain yes or no with what each means spelled out
 * underneath — "your name on the hallway TV" is the thing being agreed to,
 * so that is what it says — and the line that will appear under the
 * shout-out is shown live, so nobody is surprised by it on the wall.
 */
export function ShoutOutForm({ slug, short, email }: { slug: string; short: string; email: string }) {
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState("");
  const [showName, setShowName] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const from = shoutOutFrom({ firstName, lastName, grade, showName: showName === true });

  function submit() {
    if (showName === null) { setError("Say whether your name may be shown."); return; }
    const form = new FormData();
    form.set("slug", slug);
    form.set("text", text);
    form.set("firstName", firstName);
    form.set("lastName", lastName);
    form.set("grade", grade);
    form.set("showName", showName ? "1" : "0");
    setError(null);
    start(async () => {
      const res = await submitShoutOut(form);
      if (!res.ok) { setError(res.error); return; }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div>
        <h2 style={{ fontFamily: F.ui, fontSize: "22px", fontWeight: 800, color: C.ink, margin: "0 0 8px" }}>Sent. Thank you.</h2>
        <p style={{ ...T.read, color: C.muted, margin: "0 0 16px" }}>
          A teacher reads it first, then it goes up on the {short} screen.
        </p>
        <Btn tone="quiet" onClick={() => { setSent(false); setText(""); }}>Send another</Btn>
      </div>
    );
  }

  const choice = (on: boolean, title: string, sub: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={showName === on}
      onClick={() => setShowName(on)}
      style={{
        flex: "1 1 200px", textAlign: "left", padding: "12px 14px", borderRadius: "12px", cursor: "pointer",
        border: `2px solid ${showName === on ? C.blue : C.hairline}`, background: showName === on ? C.blueTint : C.white,
      }}
    >
      <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: "15px", color: C.ink }}>{title}</div>
      <div style={{ ...T.small, color: C.muted, fontSize: "13px", marginTop: "2px" }}>{sub}</div>
    </button>
  );

  return (
    <div>
      <Field label="Your shout-out" hint={`${text.length}/220`}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={220}
          rows={4}
          placeholder="Mrs. Klein, thank you for staying after class to help me. It finally makes sense!"
          style={{ ...input, minHeight: "110px", resize: "vertical", lineHeight: 1.45 }}
        />
      </Field>
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: "2 1 0" }}>
          <Field label="First name"><input style={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={30} autoComplete="given-name" /></Field>
        </div>
        <div style={{ flex: "2 1 0" }}>
          {/* As much or as little as they want: "B", "Berkowitz", or
              nothing at all. The line under the choice below shows them
              exactly what the wall will say before they send it. */}
          <Field label="Last name" hint="or just an initial — up to you">
            <input
              style={input}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={30}
              autoComplete="family-name"
            />
          </Field>
        </div>
      </div>
      <Field label="Grade">
        <input style={input} value={grade} onChange={(e) => setGrade(e.target.value)} maxLength={20} placeholder="9th" />
      </Field>

      <div style={{ ...T.meta, color: C.ink, margin: "6px 0 6px" }}>MAY WE SHOW YOUR NAME ON THE SCREEN?</div>
      <div role="radiogroup" aria-label="May we show your name" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
        {choice(true, "Yes, show my name", "Your name as you wrote it above, on the hallway TV.")}
        {choice(false, "No, just my grade", "Your shout-out still goes up, without your name.")}
      </div>
      {showName !== null && from ? (
        <div style={{ ...T.small, color: C.muted, marginBottom: "10px" }}>Under your shout-out it will say: <strong style={{ color: C.ink }}>{from}</strong></div>
      ) : null}

      {error ? <Note tone="error">{error}</Note> : null}
      <Btn onClick={submit} disabled={pending}>{pending ? "Sending…" : "Send it"}</Btn>
      <p style={{ ...T.small, color: C.faint, fontSize: "12.5px", marginTop: "12px" }}>
        Sending as {email}. Your teacher sees your email; the screen never does.
      </p>
    </div>
  );
}
