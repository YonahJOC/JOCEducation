"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/joc-tokens";

/**
 * One quiet switch in the masthead, for the person who can edit, tag and
 * remove. Off, the feed reads as a feed; on, the controls appear on every
 * row at once rather than being hunted for one item at a time.
 *
 * It flips an attribute on <html> and globals.css does the hiding, so a feed
 * of forty items costs one toggle rather than forty pieces of state.
 *
 * Cosmetic only. Every action behind it is refused server-side for anybody
 * who is not a super admin, whatever this is showing.
 */

const KEY = "joc-admin-tools";

export function AdminToggle({ dark = false }: { dark?: boolean }) {
  const [on, setOn] = useState(false);

  // Read the remembered choice after mounting: the server has no idea what
  // this browser last chose, and guessing would make the markup disagree.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* private window */ }
    const next = saved === "on";
    setOn(next);
    document.documentElement.dataset.adminTools = next ? "on" : "off";
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const flip = () => {
    const next = !on;
    setOn(next);
    document.documentElement.dataset.adminTools = next ? "on" : "off";
    try { localStorage.setItem(KEY, next ? "on" : "off"); } catch { /* private window */ }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={flip}
      title={on ? "Hide edit, tag and remove" : "Show edit, tag and remove"}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: "transparent", border: 0, cursor: "pointer",
        font: "500 13px/1 var(--font-outfit)",
        color: dark ? "#DCE2EE" : C.muted,
        padding: "4px 0",
      }}
    >
      <span style={{
        width: "30px", height: "18px", borderRadius: "10px", flex: "0 0 auto",
        background: on ? C.blue : "#C9D0DF",
        display: "flex", justifyContent: on ? "flex-end" : "flex-start",
        padding: "2px", boxSizing: "border-box", transition: "background .15s",
      }}>
        <span style={{
          width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
        }} />
      </span>
      Admin tools
    </button>
  );
}
