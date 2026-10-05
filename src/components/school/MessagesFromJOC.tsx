"use client";

import { useActionState } from "react";
import { writeToJOC, type MessageResult } from "@/app/actions/school-messages";
import { C, R, F, label, primaryButton } from "@/lib/joc-tokens";

/**
 * The school's half of the conversation with JOC.
 *
 * The same thread the coordinator sees on their console, from the other end.
 * Nothing was emailed to get here — the school is reading it because they
 * opened their own portal, which is the only way anything reaches them
 * before JOC launches.
 */

const when = (d: Date) =>
  new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });

export function MessagesFromJOC({
  programId, messages, coordinator,
}: {
  programId: number | null;
  /** Who it reaches, which is the only thing a school wants to know. */
  coordinator?: string | null;
  messages: {
    id: string; body: string; inbound: boolean;
    author: string | null; sentAt: Date;
  }[];
}) {
  const bound = writeToJOC.bind(null, programId);
  const [state, action, pending] = useActionState<MessageResult | null, FormData>(bound, null);

  return (
    <section style={{ marginTop: "24px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>
        {coordinator ? `Messages with ${coordinator}` : "Messages with JOC"}
      </p>

      {messages.length === 0 ? (
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: "0 0 12px", lineHeight: 1.5, maxWidth: "58ch" }}>
          Nothing yet. Anything you write here goes straight to{" "}
          {coordinator ?? "whoever looks after your programs"}.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                backgroundColor: m.inbound ? C.white : C.panel,
                border: `1px solid ${m.inbound ? C.hairline : "transparent"}`,
                borderRadius: R.form,
                padding: "12px 14px",
                marginLeft: m.inbound ? "40px" : 0,
                marginRight: m.inbound ? 0 : "40px",
              }}
            >
              <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.ink, margin: "0 0 6px" }}>
                {m.body}
              </p>
              <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>
                {m.inbound ? "You" : m.author ?? "JOC"} · {when(m.sentAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {state?.ok ? (
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.greenText, margin: 0, lineHeight: 1.5 }}>
          Sent. {coordinator ?? "Whoever looks after your programs"} sees it on their console.
        </p>
      ) : (
        <form action={action}>
          <textarea
            name="body"
            rows={3}
            required
            placeholder={coordinator ? `Write to ${coordinator}` : "Write to JOC"}
            style={{
              width: "100%", boxSizing: "border-box", fontFamily: F.read, fontSize: "16px",
              lineHeight: 1.55, color: C.ink, backgroundColor: C.white,
              border: `1px solid ${C.hairline}`, borderRadius: R.form,
              padding: "10px 12px", resize: "vertical", marginBottom: "8px",
            }}
          />

          {state && !state.ok && (
            <p style={{ fontFamily: F.read, fontSize: "14px", color: C.orangeText, margin: "0 0 8px" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{ ...primaryButton, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Saving…" : "Send it"}
          </button>
        </form>
      )}
    </section>
  );
}
