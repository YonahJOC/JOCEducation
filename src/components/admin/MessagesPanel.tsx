"use client";

import { useState, useTransition } from "react";
import { R, C } from "@/lib/joc-tokens";
import { setMessageHandled } from "@/app/actions/admin";

export type MessageRow = {
  id: string;
  name: string;
  email: string;
  schoolName: string | null;
  role: string | null;
  subject: string | null;
  message: string;
  handled: boolean;
  emailed: boolean;
  when: string;
};

/** Whatever came through the contact form, and whether it has been answered. */
export function MessagesPanel({ messages, disabled }: { messages: MessageRow[]; disabled?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (messages.length === 0) {
    return (
      <p style={{ fontSize: "14.5px", color: "#4A5A74", margin: 0, padding: "22px" }}>
        No messages through the contact form yet.
      </p>
    );
  }

  return (
    <div>
      {messages.map((m, i) => (
        <div key={m.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`, padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: "14.5px", fontWeight: 600, color: C.ink, margin: 0 }}>
                {m.subject || "No subject"}
                {!m.handled && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#C96C00", backgroundColor: "rgba(250,145,45,.15)", padding: "2px 8px", borderRadius: R.chip, marginLeft: "8px", letterSpacing: "0.06em" }}>
                    NEW
                  </span>
                )}
              </p>
              <p style={{ fontSize: "13px", color: "#4A5A74", margin: "2px 0 0", wordBreak: "break-word" }}>
                {m.name} · {m.email}
                {m.schoolName ? ` · ${m.schoolName}` : ""}
                {m.role ? ` · ${m.role}` : ""} · {m.when}
                {m.emailed ? "" : " · not emailed"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
              <button
                onClick={() => setOpen(open === m.id ? null : m.id)}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: C.blue, background: "none", border: "none", cursor: "pointer", minHeight: "40px" }}
              >
                {open === m.id ? "Hide" : "Read"}
              </button>
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to JOC Education"}`)}`}
                style={{ fontSize: "13px", fontWeight: 600, color: C.blue, textDecoration: "none", minHeight: "40px", display: "flex", alignItems: "center" }}
              >
                Reply
              </a>
              <button
                onClick={() => start(async () => { await setMessageHandled(m.id, !m.handled); })}
                disabled={disabled || pending}
                style={{ fontFamily: "var(--font-outfit)", fontSize: "13px", fontWeight: 600, color: m.handled ? "#4A5A74" : C.greenText, background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", minHeight: "40px" }}
              >
                {m.handled ? "Reopen" : "Done"}
              </button>
            </div>
          </div>

          {open === m.id && (
            <p style={{ fontSize: "14.5px", color: "#4A5A74", lineHeight: 1.6, margin: "12px 0 0", whiteSpace: "pre-wrap", backgroundColor: "#FBF9F4", borderRadius: "12px", padding: "14px 16px" }}>
              {m.message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
