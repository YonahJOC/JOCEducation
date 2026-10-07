"use client";

import { C, F } from "@/lib/joc-tokens";

/**
 * On a phone: the sections, with their counts, jumping down the page.
 *
 * The one horizontal scroller on the whole thing, and it is sticky — on a
 * 375px screen My desk is about six screens tall, and without this the only
 * way to reach the Buzz is to scroll past everything else every time.
 *
 * Hidden above 768px by the class in globals.css; the page there is short
 * enough to see whole.
 */

export type Chip = { label: string; count: number | null; to: string };

export function ChipRow({ chips }: { chips: Chip[] }) {
  return (
    <nav
      className="joc-desk-chips"
      aria-label="Jump to a section"
      style={{
        position: "sticky", top: 0, zIndex: 20,
        backgroundColor: C.paper,
        margin: "0 -16px 22px", padding: "10px 16px",
        borderBottom: `1px solid ${C.hairline}`,
        // `display` is deliberately not set here: the media query in
        // globals.css owns it, and an inline value would beat the query and
        // leave this showing on a desktop.
        gap: "7px", overflowX: "auto",
      }}
    >
      {chips.map((c) => (
        <a
          // The label, not the target: Your list and Diary both point at
          // Your week, and Buzz and Board both at the bottom band.
          key={c.label}
          href={`#${c.to}`}
          style={{
            flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: "6px",
            backgroundColor: C.white, border: `1px solid ${C.hairline}`,
            borderRadius: "999px", padding: "7px 12px", minHeight: "36px",
            fontFamily: F.ui, fontSize: "13px", fontWeight: 600, color: C.ink,
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          {c.label}
          {c.count !== null && c.count > 0 && (
            <span style={{
              fontFamily: F.data, fontSize: "10.5px", fontWeight: 600,
              color: C.muted,
            }}>
              {c.count}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}
