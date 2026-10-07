"use client";

import { useState } from "react";
import { C, F } from "@/lib/joc-tokens";

/**
 * What somebody wrote, cut to six lines with a way to open it.
 *
 * Somebody pasted a whole email into an update and that one card became as
 * tall as the other five put together, which makes the feed unreadable — you
 * cannot scan a list whose rows are a paragraph and a page.
 *
 * Whether to clamp is decided from the text itself rather than by measuring
 * the rendered box: a measurement has to happen after the browser has laid
 * the page out, which means the card renders tall and then jumps, and it
 * cannot happen at all on the server. Counting lines and characters is
 * approximate and silent; a jump is exact and horrible.
 */

const LINES = 6;
const LONG = 320;

export function Detail({ text }: { text: string }) {
  const long = text.length > LONG || text.split("\n").length > LINES;
  const [open, setOpen] = useState(false);
  const clamped = long && !open;

  return (
    <div style={{ margin: "8px 0 0" }}>
      <p style={{
        fontFamily: F.read, fontSize: "16px", lineHeight: 1.6, color: C.muted,
        margin: 0, maxWidth: "62ch", whiteSpace: "pre-wrap", wordBreak: "break-word",
        ...(clamped
          ? {
              display: "-webkit-box",
              WebkitLineClamp: LINES,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }
          : {}),
      }}>
        {text}
      </p>

      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            fontFamily: F.ui, fontSize: "14px", fontWeight: 600, color: C.blue,
            background: "none", border: "none", cursor: "pointer",
            padding: "6px 0 0", minHeight: "32px",
          }}
        >
          {open ? "Show less" : "See more"}
        </button>
      )}
    </div>
  );
}
