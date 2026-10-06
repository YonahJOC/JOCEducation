"use client";

import { useState } from "react";
import { writeToJOC } from "@/app/actions/school-messages";
import { markConversationSeen } from "@/app/actions/school-messages";
import { Conversation, type ThreadMessage } from "@/components/ui/Conversation";
import { C, F, label, datum } from "@/lib/joc-tokens";

/**
 * A school's conversations with JOC.
 *
 * One per program they run, plus General. The list says who reads each one
 * before anything is written, which is the single thing the old screen could
 * not answer: it named two coordinators above one undivided thread whose box
 * said "Write to JOC".
 *
 * Below 760 the list and the thread are each the whole screen, with a back
 * arrow — two panes side by side on a phone gives neither enough room.
 */

export type SchoolConversation = {
  programId: number | null;
  programName: string;
  slug: string | null;
  dot: string;
  reader: { name: string; fallback: boolean; line: string };
  bookingUrl: string | null;
  starters: string[];
  messages: ThreadMessage[];
  unread: number;
  waiting: boolean;
  lastAt: string | null;
};

const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "JOC";

const ago = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

export function SchoolMessages({
  conversations, schoolName,
}: {
  conversations: SchoolConversation[];
  schoolName: string;
}) {
  const first =
    conversations.find((c) => c.unread > 0) ?? conversations.find((c) => c.messages.length > 0) ?? conversations[0];

  const [openKey, setOpenKey] = useState<string>(key(first));
  const [view, setView] = useState<"list" | "thread">("list");

  const open = conversations.find((c) => key(c) === openKey) ?? first;
  const programs = conversations.filter((c) => c.programId != null);

  return (
    <div className="joc-msg-card">
      <nav className={`joc-msg-list ${view === "thread" ? "joc-hide-sm" : ""}`}>
        <p style={{ ...label, color: C.muted, margin: "0 0 6px" }}>Who you can write to</p>

        {conversations.map((c) => {
          const on = key(c) === openKey;
          const last = c.messages[c.messages.length - 1];

          return (
            <button
              key={key(c)}
              type="button"
              onClick={() => {
                setOpenKey(key(c));
                setView("thread");
                if (c.unread > 0) void markConversationSeen(c.programId);
              }}
              style={{
                textAlign: "left", cursor: "pointer", width: "100%",
                backgroundColor: on ? C.panel : "transparent",
                border: "none", borderRadius: "12px", padding: "11px 12px", minHeight: "44px",
                display: "flex", gap: "11px", alignItems: "flex-start",
              }}
            >
              <span aria-hidden="true" style={{
                position: "relative", flexShrink: 0,
                width: "38px", height: "38px", borderRadius: "50%",
                backgroundColor: C.white, border: `1px solid ${C.hairline}`,
                color: C.blue, fontFamily: F.ui, fontSize: "13px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {initials(c.reader.name)}
                <span style={{
                  position: "absolute", right: "-1px", bottom: "-1px",
                  width: "11px", height: "11px", borderRadius: "50%",
                  backgroundColor: c.dot, border: `2px solid ${C.white}`,
                }} />
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "baseline" }}>
                  <span style={{
                    fontFamily: F.ui, fontSize: "15px",
                    fontWeight: c.unread > 0 ? 800 : 600, color: C.ink,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.programName}
                  </span>
                  {c.unread > 0 ? (
                    <span style={{
                      flexShrink: 0, backgroundColor: C.orange, color: C.ink,
                      borderRadius: "999px", padding: "1px 7px",
                      fontFamily: F.ui, fontSize: "12px", fontWeight: 700,
                    }}>
                      {c.unread}
                    </span>
                  ) : (
                    <span style={{ flexShrink: 0, fontSize: "11px", color: C.muted }}>{ago(c.lastAt)}</span>
                  )}
                </span>

                <span style={{
                  display: "block", fontSize: "13px", lineHeight: 1.4, marginTop: "1px",
                  color: c.reader.fallback ? C.orangeText : C.muted,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {c.reader.name}
                  {c.reader.fallback && c.programId != null && " · no coordinator yet"}
                  {c.programId == null && " · anything else"}
                </span>

                {last && (
                  <span style={{
                    display: "block", fontSize: "13px", lineHeight: 1.4, marginTop: "2px",
                    color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {last.inbound
                      ? last.seenAt
                        ? `Read by ${c.reader.name.split(/\s+/)[0]} · no reply yet`
                        : `Not opened by ${c.reader.name.split(/\s+/)[0]} yet`
                      : last.body}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {programs.length === 1 && (
          <p style={{
            fontFamily: F.read, fontSize: "13px", lineHeight: 1.5, color: C.muted,
            margin: "10px 2px 0",
          }}>
            You run one program, so there are two conversations: one about it, and General for
            everything else.
          </p>
        )}
      </nav>

      <div className={`joc-msg-thread ${view === "list" ? "joc-hide-sm" : ""}`}>
        {open && (
          <>
            <header style={{
              display: "flex", gap: "12px", alignItems: "flex-start",
              paddingBottom: "14px", borderBottom: `1px solid ${C.hairline}`, marginBottom: "12px",
            }}>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="Back to conversations"
                className="joc-only-sm"
                style={{
                  flexShrink: 0, width: "44px", height: "44px", borderRadius: "12px",
                  border: "none", background: "transparent", color: C.ink,
                  fontSize: "20px", cursor: "pointer",
                }}
              >
                ←
              </button>

              <span aria-hidden="true" style={{
                flexShrink: 0, width: "44px", height: "44px", borderRadius: "50%",
                backgroundColor: C.panel, color: C.blue,
                fontFamily: F.ui, fontSize: "15px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {initials(open.reader.name)}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...datum, color: C.muted, margin: "0 0 2px" }}>
                  {open.programName.toUpperCase()}
                </p>
                <p style={{
                  fontFamily: F.ui, fontSize: "18px", fontWeight: 700, color: C.ink,
                  margin: "0 0 3px", lineHeight: 1.2,
                }}>
                  {open.reader.name}
                </p>
                <p style={{
                  fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, margin: 0,
                  color: open.reader.fallback ? C.orangeText : C.muted,
                }}>
                  {open.reader.line}
                </p>
              </div>

              {open.bookingUrl && (
                <a
                  href={open.bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flexShrink: 0, fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                    color: C.blue, border: `2px solid ${C.blue}`, borderRadius: "12px",
                    padding: "0 14px", minHeight: "44px", textDecoration: "none",
                    display: "inline-flex", alignItems: "center",
                  }}
                >
                  Book a time ↗
                </a>
              )}
            </header>

            <Conversation
              key={openKey}
              mine="school"
              messages={open.messages}
              readerName={open.reader.name}
              starters={open.messages.length === 0 ? open.starters : undefined}
              placeholder={
                open.programId == null
                  ? `Write to ${open.reader.name}`
                  : `Write to ${open.reader.name.split(/\s+/)[0]} about ${open.programName}`
              }
              noteAfter={`${open.reader.name.split(/\s+/)[0]} sees it next time they open the JOC console.`}
              send={async (body) => {
                const form = new FormData();
                form.set("body", body);
                const res = await writeToJOC(open.programId, null, form);
                return res.ok ? null : res.error;
              }}
            />
          </>
        )}
      </div>

      <span hidden>{schoolName}</span>
    </div>
  );
}

const key = (c: SchoolConversation | undefined) =>
  c ? (c.programId == null ? "general" : String(c.programId)) : "general";
