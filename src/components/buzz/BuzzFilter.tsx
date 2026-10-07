"use client";

import { useState } from "react";
import { C, F } from "@/lib/joc-tokens";

/**
 * My schools, or all of JOC.
 *
 * A coordinator who runs one program has no use for forty-four schools'
 * notes by default, and an unfiltered feed is one they stop reading. A super
 * admin has the opposite problem, so theirs starts on everything.
 *
 * The cards are rendered on the server and handed in already built; this
 * only chooses which of them to show. Nothing is re-fetched to change a
 * filter.
 */

export type FeedItem = {
  id: string;
  schoolId: string;
  mine: boolean;
  node: React.ReactNode;
};

export function BuzzFilter({
  items, cap, startAll,
}: {
  items: FeedItem[];
  cap: number;
  /** Super admins start on everything; everybody else on their own schools. */
  startAll: boolean;
}) {
  const [all, setAll] = useState(startAll);
  const [open, setOpen] = useState(false);

  const canNarrow = items.some((i) => i.mine) && items.some((i) => !i.mine);
  const shown = all || !canNarrow ? items : items.filter((i) => i.mine);
  const rest = shown.length - cap;

  return (
    <>
      {canNarrow && (
        <div style={{
          display: "inline-flex", background: "#EEF0F5", borderRadius: "10px",
          padding: "3px", gap: "2px", marginBottom: "12px",
        }}>
          {[
            { on: !all, label: "My schools", set: false },
            { on: all, label: "All JOC", set: true },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              aria-pressed={t.on}
              onClick={() => { setAll(t.set); setOpen(false); }}
              style={{
                background: t.on ? "#fff" : "transparent",
                color: t.on ? "#10233F" : "#5A6782",
                border: 0, borderRadius: "8px", padding: "7px 11px",
                font: `${t.on ? 600 : 500} 13px/1 var(--font-outfit)`,
                boxShadow: t.on ? "0 1px 2px rgba(16,35,63,.08)" : "none",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: "10px" }}>
        {shown.length === 0 ? (
          <div style={{
            backgroundColor: C.white, borderRadius: "16px", padding: "16px 18px",
            boxShadow: "0 2px 0 #E3E6EF, 0 6px 18px rgba(16,35,63,.05)",
          }}>
            <p style={{ fontFamily: F.read, fontSize: "15px", lineHeight: 1.5, color: C.muted, margin: 0 }}>
              Nothing new from your schools this week.
            </p>
          </div>
        ) : (
          (open ? shown : shown.slice(0, cap)).map((i) => (
            <div key={i.id}>{i.node}</div>
          ))
        )}

        {rest > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              justifySelf: "start",
              fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 0", minHeight: "32px",
            }}
          >
            {open ? "Show fewer" : `Show ${rest} more ${rest === 1 ? "note" : "notes"}`}
          </button>
        )}
      </div>
    </>
  );
}
