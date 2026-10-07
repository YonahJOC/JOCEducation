"use client";

import { useState, useTransition } from "react";
import { readNotice } from "@/app/actions/desk";
import type { Notice } from "@/lib/desk";
import { C, F } from "@/lib/joc-tokens";

/**
 * The newest notice, across the top, while it is still news.
 *
 * Only one, only when it is under two days old and unread. A board is
 * something you choose to look at; this is the one case where something
 * pinned should interrupt — and the moment it is read, or two days pass, it
 * stops interrupting.
 */
export function NoticeStrip({ notice }: { notice: Notice }) {
  const [gone, setGone] = useState(false);
  const [, start] = useTransition();
  if (gone) return null;

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px",
      backgroundColor: C.blueTint, borderRadius: "12px", padding: "11px 14px",
      margin: "-6px 0 30px",
    }}>
      <span style={{
        fontFamily: F.data, fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: C.blue,
      }}>
        On the board · {notice.dept}
      </span>
      <span style={{
        fontFamily: F.ui, fontSize: "15px", fontWeight: 600, color: C.ink,
        flex: "1 1 200px", minWidth: 0, lineHeight: 1.3,
      }}>
        {notice.title}
      </span>
      <button
        type="button"
        onClick={() => {
          setGone(true);
          start(async () => { await readNotice(notice.id); });
        }}
        style={{
          background: "transparent", border: "none", cursor: "pointer", padding: "4px",
          fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
        }}
      >
        Got it
      </button>
    </div>
  );
}
