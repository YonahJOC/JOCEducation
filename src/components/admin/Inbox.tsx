"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { writeToSchool, markSchoolConversationSeen } from "@/app/actions/school-messages";
import { Conversation, type ThreadMessage } from "@/components/ui/Conversation";
import { C, F, label, datum } from "@/lib/joc-tokens";

/**
 * Every conversation a school has started, and the ones you could start.
 *
 * Sorted unread first, then waiting, then newest. A school that has never
 * written does not clutter the list — it is found by searching, and picking
 * one opens an empty thread, because starting a conversation is a thing a
 * coordinator should be able to do without going somewhere else first.
 */

export type InboxRow = {
  key: string;
  schoolId: string;
  schoolName: string;
  programId: number | null;
  programName: string;
  dot: string;
  /** Who reads it, which for a program with no coordinator is the fallback. */
  readerName: string;
  fallback: boolean;
  /** The school's own people who write here. */
  writers: string[];
  hasLogins: boolean;
  messages: ThreadMessage[];
  unread: number;
  waiting: boolean;
  lastAt: string | null;
};

const initials = (n: string) =>
  n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const ago = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

export function Inbox({
  rows, startable, programs, showProgram, quietCount,
}: {
  rows: InboxRow[];
  /** Schools with nothing written, found by searching. */
  startable: { schoolId: string; schoolName: string; programId: number | null; programName: string; dot: string; readerName: string; fallback: boolean; hasLogins: boolean }[];
  /** For the super admin's filter chips. */
  programs: { id: number | null; name: string }[];
  showProgram: boolean;
  /** How many schools run something and have never written. */
  quietCount: number;
}) {
  const [openKey, setOpenKey] = useState<string | null>(rows[0]?.key ?? null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "thread">("list");
  const [extra, setExtra] = useState<InboxRow[]>([]);

  const all = useMemo(() => [...extra, ...rows], [extra, rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (filter !== "all" && String(r.programId ?? "general") !== filter) return false;
      if (!q) return true;
      return r.schoolName.toLowerCase().includes(q) || r.programName.toLowerCase().includes(q);
    });
  }, [all, filter, query]);

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return startable
      .filter((s) => s.schoolName.toLowerCase().includes(q))
      .filter((s) => !all.some((r) => r.schoolId === s.schoolId && r.programId === s.programId))
      .slice(0, 6);
  }, [startable, query, all]);

  const open = all.find((r) => r.key === openKey) ?? null;

  return (
    <div className="joc-msg-card">
      <nav className={`joc-msg-list ${view === "thread" ? "joc-hide-sm" : ""}`}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a school, or start with one"
          style={{
            width: "100%", boxSizing: "border-box", fontFamily: F.read, fontSize: "15px",
            color: C.ink, backgroundColor: C.white, border: `1px solid ${C.hairline}`,
            borderRadius: "12px", padding: "10px 12px", minHeight: "44px", marginBottom: "8px",
          }}
        />

        {showProgram && programs.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
            {[{ id: "all", name: "All" }, ...programs.map((p) => ({ id: String(p.id ?? "general"), name: p.name }))].map((p) => {
              const on = String(p.id) === filter;
              return (
                <button
                  key={String(p.id)}
                  type="button"
                  onClick={() => setFilter(String(p.id))}
                  aria-pressed={on}
                  style={{
                    fontFamily: F.ui, fontSize: "13px", fontWeight: 600,
                    color: on ? C.white : C.ink,
                    backgroundColor: on ? C.ink : C.white,
                    border: on ? "none" : `1px solid ${C.hairline}`,
                    borderRadius: "999px", padding: "6px 12px", minHeight: "32px", cursor: "pointer",
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}

        {shown.map((r) => {
          const on = r.key === openKey;
          const last = r.messages[r.messages.length - 1];
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setOpenKey(r.key);
                setView("thread");
                if (r.unread > 0) void markSchoolConversationSeen(r.schoolId, r.programId);
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
                {initials(r.schoolName)}
                <span style={{
                  position: "absolute", right: "-1px", bottom: "-1px",
                  width: "11px", height: "11px", borderRadius: "50%",
                  backgroundColor: r.dot, border: `2px solid ${C.white}`,
                }} />
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "baseline" }}>
                  <span style={{
                    fontFamily: F.ui, fontSize: "15px",
                    fontWeight: r.unread > 0 ? 800 : 600, color: C.ink,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {r.schoolName}
                  </span>
                  {r.unread > 0 ? (
                    <span style={{
                      flexShrink: 0, backgroundColor: C.orange, color: C.ink,
                      borderRadius: "999px", padding: "1px 7px",
                      fontFamily: F.ui, fontSize: "12px", fontWeight: 700,
                    }}>
                      {r.unread}
                    </span>
                  ) : r.waiting ? (
                    <span style={{ flexShrink: 0, ...label, color: C.orangeText }}>Waiting</span>
                  ) : (
                    <span style={{ flexShrink: 0, fontSize: "11px", color: C.muted }}>{ago(r.lastAt)}</span>
                  )}
                </span>

                <span style={{
                  display: "block", fontSize: "13px", lineHeight: 1.4, marginTop: "1px",
                  color: !r.hasLogins ? C.orangeText : C.muted,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {showProgram && `${r.programName} · `}
                  {!r.hasLogins
                    ? "No logins yet"
                    : r.writers.length > 0
                    ? r.writers.join(", ")
                    : "Nobody has written yet"}
                  {showProgram && r.fallback && " · no coordinator, yours"}
                </span>

                {last && (
                  <span style={{
                    display: "block", fontSize: "13px", lineHeight: 1.4, marginTop: "2px",
                    color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {last.inbound ? last.body : `You: ${last.body}`}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {found.length > 0 && (
          <>
            <p style={{ ...label, color: C.muted, margin: "12px 2px 4px" }}>Start a conversation</p>
            {found.map((s) => (
              <button
                key={`${s.schoolId}:${s.programId ?? "g"}`}
                type="button"
                onClick={() => {
                  const row: InboxRow = {
                    key: `new:${s.schoolId}:${s.programId ?? "g"}`,
                    schoolId: s.schoolId, schoolName: s.schoolName,
                    programId: s.programId, programName: s.programName, dot: s.dot,
                    readerName: s.readerName, fallback: s.fallback,
                    writers: [], hasLogins: s.hasLogins,
                    messages: [], unread: 0, waiting: false, lastAt: null,
                  };
                  setExtra((e) => [row, ...e]);
                  setOpenKey(row.key);
                  setView("thread");
                  setQuery("");
                }}
                style={{
                  textAlign: "left", cursor: "pointer", width: "100%",
                  background: "transparent", border: `1px dashed ${C.hairline}`,
                  borderRadius: "12px", padding: "10px 12px", minHeight: "44px",
                  fontFamily: F.ui, fontSize: "14px", color: C.ink,
                }}
              >
                {s.schoolName}
                <span style={{ color: C.muted }}> · {s.programName}</span>
              </button>
            ))}
          </>
        )}

        {quietCount > 0 && !query && (
          <p style={{
            fontFamily: F.read, fontSize: "13px", lineHeight: 1.5, color: C.muted,
            margin: "12px 2px 0",
          }}>
            {quietCount} more school{quietCount === 1 ? "" : "s"} run something with JOC and
            haven&rsquo;t written. Search to start a conversation with one.
          </p>
        )}
      </nav>

      <div className={`joc-msg-thread ${view === "list" ? "joc-hide-sm" : ""}`}>
        {open ? (
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
                {initials(open.schoolName)}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...datum, color: C.muted, margin: "0 0 2px" }}>
                  {open.programName.toUpperCase()}
                </p>
                <p style={{
                  fontFamily: F.ui, fontSize: "18px", fontWeight: 700, color: C.ink,
                  margin: "0 0 3px", lineHeight: 1.2,
                }}>
                  {open.schoolName}
                </p>
                <p style={{
                  fontFamily: F.read, fontSize: "14px", lineHeight: 1.5, margin: 0,
                  color: open.hasLogins ? C.muted : C.orangeText,
                }}>
                  {open.hasLogins
                    ? open.writers.length > 0
                      ? `${open.writers.join(", ")} write here`
                      : "Nobody there has written yet"
                    : "Nobody there has a login yet"}
                </p>
              </div>

              <Link
                href={`/admin/schools/${open.schoolId}`}
                style={{
                  flexShrink: 0, fontFamily: F.ui, fontSize: "14px", fontWeight: 600,
                  color: C.blue, textDecoration: "underline", minHeight: "44px",
                  display: "inline-flex", alignItems: "center",
                }}
              >
                <span className="joc-hide-sm">Open school record</span>
                <span className="joc-only-sm">Record</span>
              </Link>
            </header>

            <Conversation
              key={open.key}
              mine="joc"
              messages={open.messages}
              readerName={open.schoolName}
              placeholder={`Write to ${open.schoolName}`}
              noteAfter={
                open.hasLogins
                  ? "They read it in their own portal, next time somebody there opens it."
                  : `It stays here until ${open.schoolName} has a login.`
              }
              beforeComposer={
                open.hasLogins ? null : (
                  <p style={{
                    backgroundColor: C.orangeTint, color: C.orangeText,
                    fontFamily: F.read, fontSize: "14px", lineHeight: 1.55,
                    borderRadius: "12px", padding: "12px 14px", margin: "12px 0 0",
                  }}>
                    Nobody at {open.schoolName} has a login yet. Whatever you write waits here,
                    unread, until someone there gets an account.
                  </p>
                )
              }
              send={async (body) => {
                const form = new FormData();
                form.set("body", body);
                const res = await writeToSchool(open.schoolId, open.programId, null, form);
                return res.ok ? null : res.error;
              }}
            />
          </>
        ) : (
          <p style={{ fontFamily: F.read, fontSize: "15px", color: C.muted, margin: "auto" }}>
            Pick a school to read what they wrote.
          </p>
        )}
      </div>
    </div>
  );
}
