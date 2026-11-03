"use client";

import { useState } from "react";
import { C, F, R, T, HIT, chip } from "@/lib/joc-tokens";
import { MessageThread } from "@/components/ambassador/MessageThread";
import type { JocThread } from "@/lib/ambassador-messages";

/**
 * What student ambassadors have written to JOC.
 *
 * One list for everybody, not a mailbox each: a student writes to Just One
 * Chesed rather than to Dalia or to Yonah, so whoever opens this page
 * answers. The reply carries the name of whoever wrote it, because an
 * answer from an organisation is still an answer from a person.
 *
 * Waiting on us first. A thread nobody has read opens by itself — a
 * message from a fifteen-year-old behind a collapsed row is a message
 * nobody answers.
 */
export function StudentMessages({ threads }: { threads: JocThread[] }) {
  const waiting = threads.reduce((n, t) => n + (t.unread > 0 ? 1 : 0), 0);

  return (
    <section style={{ marginBottom: "30px" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
        <h2 style={{ fontFamily: F.ui, fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, margin: 0 }}>
          From student ambassadors
        </h2>
        {waiting > 0 ? (
          <span style={{ ...chip, backgroundColor: C.orangeTint, color: C.orangeText }}>
            {waiting} waiting
          </span>
        ) : null}
      </header>
      <p style={{ ...T.small, fontWeight: 400, color: C.muted, margin: "0 0 14px", maxWidth: "70ch" }}>
        Students write to JOC, not to one of us. Everybody here sees every thread, and whoever is
        around answers — your name goes on the reply.
      </p>

      {threads.length === 0 ? (
        <div style={{
          background: C.white, border: `1px solid ${C.hairline}`, borderRadius: R.row,
          padding: "22px", textAlign: "center",
        }}>
          <p style={{ ...T.read, color: C.muted, margin: 0 }}>
            Nothing yet. When an ambassador writes in, it lands here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {threads.map((t) => <Row key={t.ambassadorId} t={t} />)}
        </div>
      )}
    </section>
  );
}

function Row({ t }: { t: JocThread }) {
  const [open, setOpen] = useState(t.unread > 0);
  const last = t.messages[t.messages.length - 1];

  return (
    <div style={{
      background: C.white, border: `1px solid ${t.unread > 0 ? C.orange : C.hairline}`,
      borderRadius: R.row, overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap",
          width: "100%", minHeight: HIT, padding: "14px 18px", textAlign: "left",
          background: "none", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ flex: "1 1 260px", minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: F.ui, fontSize: "17px", fontWeight: 700, color: C.ink }}>
            {t.studentName}
          </span>
          <span style={{ display: "block", ...T.meta, marginTop: "3px" }}>
            {t.schoolName.toUpperCase()} · {t.programName.toUpperCase()}
            {t.current ? "" : " · FINISHED"}
          </span>
          {!open && last ? (
            <span style={{
              display: "block", ...T.small, fontWeight: 400, color: C.muted, marginTop: "6px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60ch",
            }}>
              {last.fromStudent ? "" : "You: "}{last.body}
            </span>
          ) : null}
        </span>

        {t.unread > 0 ? (
          <span style={{ ...chip, backgroundColor: C.orangeTint, color: C.orangeText }}>
            {t.unread} new
          </span>
        ) : null}
        <span aria-hidden="true" className="material-symbols-rounded" style={{ fontSize: "22px", color: C.muted }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open ? (
        <div style={{ borderTop: `1px solid ${C.rule}`, padding: "16px 18px", background: C.paper }}>
          <MessageThread
            ambassadorId={t.ambassadorId}
            messages={t.messages}
            teacherName={t.studentName}
            audience="JOC"
            closed={!t.current}
            note={`${t.studentName} at ${t.schoolName}. Your reply goes out under your own name.`}
          />
        </div>
      ) : null}
    </div>
  );
}
