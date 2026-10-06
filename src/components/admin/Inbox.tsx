"use client";

import { useState } from "react";
import { writeToSchool, markThreadSeen } from "@/app/actions/school-messages";
import { Conversation, type Message } from "@/components/ui/Conversation";
import { C, R, F, label, rowCard } from "@/lib/joc-tokens";

/**
 * Every school that has written in, and the conversation with each.
 *
 * The answer to "where does Gilad see it". A row on Today told him a school
 * had written and then handed him off to the schools list, which is not a
 * place where messages live — so the only way to read one was to know which
 * school it was and go digging through the app console.
 *
 * Schools with something unread sort first, then by whoever wrote most
 * recently. A school with nothing unread still appears, because answering
 * yesterday's question is a normal thing to want to do.
 */

export type InboxSchool = {
  id: string;
  name: string;
  unread: number;
  lastAt: Date | null;
  messages: Message[];
};

const ago = (d: Date | null): string => {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d`;
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

export function Inbox({ schools }: { schools: InboxSchool[] }) {
  const [openId, setOpenId] = useState<string | null>(schools[0]?.id ?? null);
  const open = schools.find((s) => s.id === openId) ?? null;

  if (schools.length === 0) {
    return (
      <p style={{ fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted, margin: 0, maxWidth: "58ch" }}>
        No school has written in yet. When one does it appears here, and on your Today page.
      </p>
    );
  }

  return (
    <div className="joc-inbox">
      <nav style={{ display: "grid", gap: "6px", alignContent: "start" }}>
        {schools.map((s) => {
          const on = s.id === openId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setOpenId(s.id);
                if (s.unread > 0) void markThreadSeen(s.id, "joc");
              }}
              style={{
                textAlign: "left", cursor: "pointer", width: "100%",
                backgroundColor: on ? C.ink : C.white,
                color: on ? C.white : C.ink,
                border: on ? "none" : `1px solid ${C.hairline}`,
                borderRadius: R.form, padding: "12px 14px", minHeight: "44px",
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "baseline" }}>
                <span style={{ fontFamily: F.ui, fontSize: "15px", fontWeight: s.unread > 0 ? 700 : 600, minWidth: 0 }}>
                  {s.name}
                </span>
                {s.unread > 0 ? (
                  <span style={{
                    flexShrink: 0, backgroundColor: C.orange, color: C.ink,
                    borderRadius: "999px", padding: "1px 8px",
                    fontFamily: F.ui, fontSize: "12px", fontWeight: 700,
                  }}>
                    {s.unread}
                  </span>
                ) : (
                  <span style={{ flexShrink: 0, fontSize: "12px", color: on ? C.onDarkBody : C.muted }}>
                    {ago(s.lastAt)}
                  </span>
                )}
              </span>

              {s.messages.length > 0 && (
                <span style={{
                  display: "block", marginTop: "3px", fontSize: "13px", lineHeight: 1.4,
                  color: on ? C.onDarkBody : C.muted,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {s.messages[s.messages.length - 1].body}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ ...rowCard, padding: "16px 18px", minWidth: 0 }}>
        {open ? (
          <>
            <p style={{ ...label, color: C.muted, margin: "0 0 10px" }}>{open.name}</p>
            <Conversation
              mine="joc"
              messages={open.messages}
              placeholder={`Write to ${open.name}`}
              note="They read it in their own portal. Nothing is emailed — no school hears from us until JOC launches."
              send={async (body) => {
                const form = new FormData();
                form.set("body", body);
                const res = await writeToSchool(open.id, null, null, form);
                return res.ok ? null : res.error;
              }}
            />
          </>
        ) : (
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: 0 }}>
            Pick a school to read what they wrote.
          </p>
        )}
      </div>
    </div>
  );
}
