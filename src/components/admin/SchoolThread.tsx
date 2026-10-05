"use client";

import { useActionState } from "react";
import { writeToSchool, type MessageResult } from "@/app/actions/school-messages";
import { C, R, F, label, primaryButton } from "@/lib/joc-tokens";

/**
 * The conversation with the people who run a school's account.
 *
 * Nothing is sent. What a coordinator writes is stored and shown to the
 * school the next time somebody there signs in to their own panel — so the
 * standing rule holds, and the line under the box says exactly that rather
 * than implying a message has gone out.
 *
 * The panel used to carry a flat refusal here: "replies can't go out to
 * schools until JOC launches, call instead". That was true of email and read
 * as true of everything, so there was no way to answer a school at all.
 */

const when = (d: Date) =>
  new Date(d).toLocaleDateString("en-US", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });

export function SchoolThread({
  schoolId, programId, schoolName, messages, admins,
}: {
  schoolId: string;
  programId: number | null;
  schoolName: string;
  messages: {
    id: string; body: string; inbound: boolean;
    author: string | null; sentAt: Date; seenAt: Date | null;
  }[];
  /** Nobody to write to is worth saying before somebody writes. */
  admins: number;
}) {
  const bound = writeToSchool.bind(null, schoolId, programId);
  const [state, action, pending] = useActionState<MessageResult | null, FormData>(bound, null);

  return (
    <section style={{ marginTop: "16px" }}>
      <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>
        Messages with {schoolName}
      </p>

      {messages.length > 0 && (
        <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                backgroundColor: m.inbound ? C.panel : C.white,
                border: `1px solid ${m.inbound ? "transparent" : C.hairline}`,
                borderRadius: R.form,
                padding: "12px 14px",
                marginLeft: m.inbound ? 0 : "40px",
                marginRight: m.inbound ? "40px" : 0,
              }}
            >
              <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.55, color: C.ink, margin: "0 0 6px" }}>
                {m.body}
              </p>
              <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>
                {m.inbound ? m.author ?? "Somebody at the school" : m.author ?? "JOC"}
                {" · "}
                {when(m.sentAt)}
                {!m.inbound && (m.seenAt ? " · read" : " · not read yet")}
              </p>
            </div>
          ))}
        </div>
      )}

      {state?.ok ? (
        <p style={{ fontFamily: F.read, fontSize: "15px", color: C.greenText, margin: 0, lineHeight: 1.5 }}>
          Saved. {schoolName} sees it next time somebody there opens the portal.
        </p>
      ) : (
        <form action={action}>
          <textarea
            name="body"
            rows={3}
            required
            placeholder={`Write to ${schoolName}`}
            style={{
              width: "100%", boxSizing: "border-box", fontFamily: F.read, fontSize: "15px",
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
            {pending ? "Saving…" : "Leave it for them"}
          </button>

          <p style={{ fontFamily: F.read, fontSize: "13px", color: C.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
            {admins === 0
              ? "Nobody at this school has a login yet, so nobody will see it until somebody does."
              : "They read it in their own portal. Nothing is emailed — no school hears from us until JOC launches."}
          </p>
        </form>
      )}
    </section>
  );
}
