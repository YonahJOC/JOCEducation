"use client";

import { useState } from "react";
import { C, F } from "@/lib/joc-tokens";

/**
 * A few, then the rest, opening where they are.
 *
 * Every long section on this page caps the same way. Nothing opens a modal
 * and nothing scrolls inside itself: a page where each panel has its own
 * scrollbar is a page where nothing can be read straight through, and the
 * thing somebody is looking for is always in the half you cannot see.
 */
export function ShowMore({
  first, rest, count, word,
}: {
  first: React.ReactNode;
  rest: React.ReactNode;
  count: number;
  word: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {first}
      {open && rest}
      {count > 0 && (
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
          {open ? "Show fewer" : `Show ${count} more ${count === 1 ? word : `${word}s`}`}
        </button>
      )}
    </div>
  );
}
